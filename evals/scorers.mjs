// 4 scorers — RÈGLES D'ABORD (déterministes, hors ligne, reproductibles).
// Miroir minimal de src/mastra/voice/voice-corpus.ts (source de vérité partagée).
const ANTI_VOICE = ["breaking:", "this is over", "commente ", "repost =", "indétectable"];
const VOICE_KEYWORDS = [
  "souverain", "europ", "data", "concret", "opérationnel", "agent", "poc",
  "performance", "pme", "eti", "territoire", "build", "exécution", "sales", "growth",
];

const words = (s) => s.toLowerCase().split(/[^a-zà-ÿ0-9]+/).filter((w) => w.length > 3);
const jaccard = (a, b) => {
  const A = new Set(words(a)), B = new Set(words(b));
  const inter = [...A].filter((x) => B.has(x)).length;
  const uni = new Set([...A, ...B]).size || 1;
  return inter / uni;
};

/** Les 3 angles sont-ils distincts ? (similarité textuelle sous un seuil) */
export function differentiation(angles) {
  const texts = angles.map((a) => `${a.hook} ${a.points.join(" ")}`);
  let maxSim = 0;
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) maxSim = Math.max(maxSim, jaccard(texts[i], texts[j]));
  const score = Math.round(100 * (1 - maxSim));
  return { score, why: `similarité max entre angles : ${(maxSim * 100).toFixed(0)}%` };
}

/** Ancrage : réutilise le verdict Phase 2 (angle.grounded). Règle dure : 0 si non ancré. */
export function sourceGrounded(angles) {
  const perAngle = angles.map((a) => {
    if (a.grounded === false) return 0;
    if (a.grounded === true) return 100;
    return a.sources?.length ? 60 : 20; // pas de verdict → proxy par présence de sources
  });
  const score = Math.round(perAngle.reduce((s, x) => s + x, 0) / perAngle.length);
  return { score, why: `ancrage par angle : ${perAngle.join(", ")}` };
}

/** Force du hook : règles (longueur, pas de tournure ANTI_VOICE). */
export function hookStrength(angles) {
  const perAngle = angles.map((a) => {
    const h = a.hook.toLowerCase();
    if (ANTI_VOICE.some((t) => h.includes(t))) return 0; // bait → recalé
    const len = a.hook.length;
    const lenOk = len >= 30 && len <= 140 ? 1 : 0.6;
    const hasNumber = /\d/.test(a.hook) ? 1 : 0.85; // un chiffre accroche souvent
    return Math.round(100 * lenOk * hasNumber);
  });
  const score = Math.round(perAngle.reduce((s, x) => s + x, 0) / perAngle.length);
  return { score, why: `force par hook : ${perAngle.join(", ")}` };
}

/** Alignement voix : proximité aux VOICE_KEYWORDS (et pas d'ANTI_VOICE). */
export function voiceAlignment(angles) {
  const perAngle = angles.map((a) => {
    const text = `${a.hook} ${a.points.join(" ")} ${a.cta}`.toLowerCase();
    if (ANTI_VOICE.some((t) => text.includes(t))) return 0;
    const hits = VOICE_KEYWORDS.filter((k) => text.includes(k)).length;
    return Math.min(100, 45 + hits * 14);
  });
  const score = Math.round(perAngle.reduce((s, x) => s + x, 0) / perAngle.length);
  return { score, why: `mots-voix trouvés (par angle) : ${perAngle.join(", ")}` };
}

export const SCORERS = { differentiation, sourceGrounded, hookStrength, voiceAlignment };
