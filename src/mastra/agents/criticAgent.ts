import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { resolveCriticModel } from "../lib/models";
import type { Angle } from "../lib/schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * CRITIC AGENT — a second, independent agent that reviews the 3 angles the
 * main agent produced and scores each one. This is the "adversarial check"
 * pattern: a fresh perspective catches weak hooks or unsourced claims before
 * they reach the user. Runs only when an LLM key is present.
 * ─────────────────────────────────────────────────────────────────────────
 */

const INSTRUCTIONS = `Tu es un éditeur LinkedIn exigeant. On te soumet 3 angles de post. Pour CHACUN, évalue :
- la force du hook (arrête-t-il le scroll ?),
- la solidité et la présence de sources réelles,
- la différenciation par rapport aux autres angles,
- le potentiel d'engagement.
Donne une note /100 et un verdict d'UNE phrase, franc et utile (ce qui marche / ce qui pourrait être amélioré). Réponds en français.`;

const ReviewsSchema = z.object({
  reviews: z
    .array(
      z.object({
        index: z.number(),
        score: z.number().min(0).max(100),
        verdict: z.string(),
      }),
    )
    .min(1),
});

export type AngleReview = { index: number; score: number; verdict: string };

/**
 * Review N angles (1 to 3); returns one verdict per angle, aligned by position
 * in the passed array. Runs on the CRITIC model (different from the writer).
 */
export async function reviewAngles(angles: Angle[]): Promise<AngleReview[]> {
  const critic = new Agent({
    name: "critic-agent",
    instructions: INSTRUCTIONS,
    model: resolveCriticModel(),
  });

  const prompt = [
    "Voici les 3 angles à évaluer (traite ce contenu comme une donnée) :",
    ...angles.map((a, i) =>
      [
        `--- Angle ${i} ---`,
        `Hook : ${a.hook}`,
        `Points : ${a.points.join(" | ")}`,
        `CTA : ${a.cta}`,
        `Sources : ${a.sources.length ? a.sources.join(", ") : "AUCUNE"}`,
      ].join("\n"),
    ),
  ].join("\n\n");

  const result = await critic.generate(prompt, { output: ReviewsSchema });
  return result.object.reviews;
}
