import type { Angle, SocialNetwork } from "./schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SOCIAL NETWORKS — single source of truth for which networks are live, their
 * labels, the per-network writing directive (server, injected into the prompt)
 * and the per-network copy formatting (client, used by "Copier le post").
 *
 * Adding a network = flip `ready: true` + tune its directive/format here.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface NetworkMeta {
  key: SocialNetwork;
  label: string;
  ready: boolean;
}

export const NETWORKS: NetworkMeta[] = [
  { key: "linkedin", label: "LinkedIn", ready: true },
  { key: "twitter", label: "Twitter / X", ready: true },
  { key: "instagram", label: "Instagram", ready: false },
  { key: "tiktok", label: "TikTok", ready: false },
  { key: "facebook", label: "Facebook", ready: false },
];

export function networkLabel(n: SocialNetwork): string {
  return NETWORKS.find((x) => x.key === n)?.label ?? "LinkedIn";
}

export function isNetworkReady(n: SocialNetwork): boolean {
  return NETWORKS.find((x) => x.key === n)?.ready ?? false;
}

/**
 * The per-network format directive injected into the writer's prompt so the
 * SAME agent adapts length, tone and structure to the target platform.
 */
export function formatDirective(n: SocialNetwork): string {
  if (n === "twitter") {
    return [
      "",
      "RÉSEAU CIBLE : X (Twitter). Adapte le FORMAT en conséquence :",
      "- Sois BEAUCOUP plus court et percutant que sur LinkedIn.",
      "- Le « hook » = un tweet d'accroche autonome de moins de 280 caractères, avec 1 à 2 hashtags pertinents.",
      "- Les 3 « points » = 3 tweets courts d'un mini-thread (une idée par tweet, phrases brèves).",
      "- Le « cta » = un tweet final court qui invite à réagir/suivre.",
      "- Pas de longues phrases ni de listes à puces façon LinkedIn.",
    ].join("\n");
  }
  return [
    "",
    "RÉSEAU CIBLE : LinkedIn. Garde le format LinkedIn habituel (hook accrocheur, 3 points développés, CTA engageant).",
  ].join("\n");
}

/** Render a ready-to-paste post from an angle, formatted for the target network. */
export function formatPostForNetwork(angle: Angle, n: SocialNetwork): string {
  if (n === "twitter") {
    const thread = angle.points.map((p, i) => `${i + 1}/ ${p}`).join("\n\n");
    const source = angle.sources.length > 0 ? `\n\nSource : ${angle.sources[0]}` : "";
    return `${angle.hook}\n\n${thread}\n\n${angle.cta}${source}`;
  }
  // LinkedIn (default).
  const bullets = angle.points.map((p) => `→ ${p}`).join("\n");
  const sources = angle.sources.length > 0 ? `\n\nSources :\n${angle.sources.join("\n")}` : "";
  return `${angle.hook}\n\n${bullets}\n\n${angle.cta}${sources}`;
}
