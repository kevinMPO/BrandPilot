import { NextRequest } from "next/server";
import { InspirationRequestSchema, type InspirationEvent } from "@/mastra/lib/schemas";
import { runInspirationStream } from "@/mastra/lib/runInspiration";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * INSPIRATION SSE ROUTE — streams the idea-discovery run.
 *
 * Reason (live) → search (Linkup) → propose selectable ideas. Same Node runtime
 * + SSE mechanics as the main agent route, its own compact event contract.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  let companyBrain;
  try {
    const parsed = InspirationRequestSchema.parse(await req.json().catch(() => ({})));
    companyBrain = parsed.companyBrain;
  } catch {
    return new Response(JSON.stringify({ error: "Requête invalide." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (event: InspirationEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      req.signal.addEventListener("abort", () => {
        closed = true;
      });
      controller.enqueue(encoder.encode(": connected\n\n"));

      try {
        await runInspirationStream({ brain: companyBrain, emit });
      } catch (err) {
        emit({
          type: "error",
          id: "error-1",
          payload: { message: err instanceof Error ? err.message : "Erreur inattendue." },
        });
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
