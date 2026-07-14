import { NextRequest } from "next/server";
import {
  RunRequestSchema,
  type AgentEvent,
  type CompanyBrain,
  type SocialNetwork,
} from "@/mastra/lib/schemas";
import { runAgentStream } from "@/mastra/lib/runAgent";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SSE ROUTE — streams one typed event per turn of the agent's ReAct loop.
 *
 * Must run on the Node.js runtime (NOT edge): the Mastra agent and the MCP
 * client use Node APIs. We return a ReadableStream of Server-Sent Events; the
 * frontend reads it and builds the graph live.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const runtime = "nodejs";
// SSE must not be buffered/cached by the platform.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  // ── Validate the request body against the shared Zod schema ─────────────
  let topic: string;
  let companyBrain: CompanyBrain | undefined;
  let network: SocialNetwork = "linkedin";
  try {
    const json = await req.json();
    const parsed = RunRequestSchema.parse(json);
    topic = parsed.topic;
    companyBrain = parsed.companyBrain;
    network = parsed.network;
  } catch {
    return new Response(
      JSON.stringify({ error: "Requête invalide. Fournis un champ \"topic\" (3–280 caractères)." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      // Serialize an AgentEvent as a single SSE "message" frame.
      const emit = (event: AgentEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      // If the client disconnects, stop emitting.
      req.signal.addEventListener("abort", () => {
        closed = true;
      });

      // Opening comment kicks the connection (some proxies need first bytes).
      controller.enqueue(encoder.encode(": connected\n\n"));

      try {
        await runAgentStream({ topic, companyBrain, network, emit });
      } finally {
        if (!closed) {
          controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
          closed = true;
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
