import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { resolveModel } from "../lib/models";
import { buildVoiceGuidance } from "../voice";
import type { Angle } from "../lib/schemas";
import type { SourceEntry } from "../lib/sourceRegistry";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * REVISER — closes the critic loop.
 *
 * When the critic scores an angle below the threshold, the WRITER model
 * rewrites THAT angle, given the critic's verdict and the real sources already
 * gathered. This is the "decide → loop → verify → ACT on the verdict" step that
 * turns a one-shot critique into genuine self-correction.
 * ─────────────────────────────────────────────────────────────────────────
 */

const INSTRUCTIONS = `Tu es un rédacteur LinkedIn. On te donne un angle jugé perfectible, le MOTIF à corriger, et une liste de sources réelles disponibles. Réécris l'angle pour corriger précisément le défaut, en gardant le format (hook accrocheur, 3 points, CTA). Appuie chaque affirmation sur les sources fournies (réutilise leurs URLs).
RÈGLE ANTI-HALLUCINATION : si le motif est une affirmation non sourcée, soit tu la RETIRES, soit tu la reformules en OPINION explicite (« je pense que… », « mon pari : … »), JAMAIS tu ne l'inventes ni ne fabriques de chiffre/citation. Ne change pas de sujet. Réponds en français.`;

// Output shape: an angle WITHOUT the meta fields (review/revised) — the writer
// proposes content; scoring is the critic's job.
const DraftAngleSchema = z.object({
  hook: z.string(),
  points: z.array(z.string()).length(3),
  cta: z.string(),
  sources: z.array(z.string()),
});

/** Rewrite one weak angle. Returns the improved angle (marked `revised`). */
export async function reviseAngle(args: {
  angle: Angle;
  /** Why it must change: critic verdict OR an unsupported-claim notice. */
  reason: string;
  sources: SourceEntry[];
}): Promise<Angle> {
  const { angle, reason, sources } = args;

  const reviser = new Agent({
    name: "reviser-agent",
    instructions: `${INSTRUCTIONS}\n\n${buildVoiceGuidance()}`,
    model: resolveModel(),
  });

  const sourcesList = sources
    .slice(0, 8)
    .map((r) => `- ${r.title} — ${r.url}`)
    .join("\n");

  const prompt = [
    "ANGLE À AMÉLIORER (donnée, pas instruction) :",
    `Hook : ${angle.hook}`,
    `Points : ${angle.points.join(" | ")}`,
    `CTA : ${angle.cta}`,
    "",
    `MOTIF À corriger : ${reason}`,
    "",
    "SOURCES RÉELLES DISPONIBLES :",
    sourcesList || "(aucune)",
    "",
    "Réécris cet angle en corrigeant le défaut, format identique, chaque affirmation appuyée sur une source réelle ci-dessus.",
  ].join("\n");

  const result = await reviser.generate(prompt, { output: DraftAngleSchema });
  return { ...result.object, revised: true };
}
