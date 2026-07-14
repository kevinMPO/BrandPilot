import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AngleSchema } from "../lib/schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * publishAngles — the agent's "I'm done" tool.
 *
 * The ReAct loop ends when the agent decides it has enough material and calls
 * this tool with EXACTLY 3 differentiated angles. Using a tool (instead of
 * free-text parsing) gives us guaranteed structured output and a natural place
 * to emit the final "angle" nodes. The agent itself decides when to stop —
 * that's the agentic part.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const publishAngles = createTool({
  id: "publishAngles",
  description:
    "À appeler UNE SEULE FOIS, à la toute fin, quand tu as réuni assez de matière. " +
    "Soumets EXACTEMENT 3 angles LinkedIn différenciés. Chaque angle doit être adossé " +
    "à au moins une source réelle (url) ramenée par la recherche. Si une affirmation " +
    "n'a pas de source, signale-le dans le point plutôt que d'inventer.",
  inputSchema: z.object({
    angles: z
      .array(AngleSchema)
      .length(3)
      .describe("Exactement 3 angles différenciés, chacun avec au moins une source."),
  }),
  outputSchema: z.object({
    ok: z.literal(true),
    count: z.number(),
  }),
  // The tool doesn't *do* anything except acknowledge: the route reads the
  // angles from the tool call to build the leaf nodes and the final result.
  execute: async ({ context }) => {
    return { ok: true as const, count: context.angles.length };
  },
});
