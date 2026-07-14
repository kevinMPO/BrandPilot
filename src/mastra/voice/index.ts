import { VOICE_TRAITS, ANTI_VOICE, VOICE_CORPUS } from "./voice-corpus";
import { STRUCTURE_PATTERN } from "./structure-pattern";

export { VOICE_TRAITS, ANTI_VOICE, VOICE_CORPUS } from "./voice-corpus";
export { STRUCTURE_PATTERN } from "./structure-pattern";

/**
 * Build the few-shot voice guidance injected into the writer AND the reviser.
 * Combines: explicit voice traits + annotated exemplars (learn the STYLE) +
 * the neutral structure pattern + hard ANTI_VOICE constraints + the
 * anti-hallucination guardrail + the "proud in front of a VC?" bar.
 */
export function buildVoiceGuidance(): string {
  const traits = VOICE_TRAITS.map((t) => `- ${t}`).join("\n");
  const anti = ANTI_VOICE.map((a) => `- ${a}`).join("\n");
  const examples = VOICE_CORPUS.map(
    (e, i) => `Exemple ${i + 1} :\n"""\n${e.text}\n"""\nPourquoi ça marche : ${e.annotation}`,
  ).join("\n\n");

  return `═══ VOIX & STYLE (à incarner) ═══

VOIX DE L'AUTEUR — traits à incarner :
${traits}

${STRUCTURE_PATTERN}

EXEMPLES ANNOTÉS (apprends le STYLE par l'exemple, NE recopie pas le contenu) :
${examples}

INTERDITS DURS — n'utilise JAMAIS ces tournures :
${anti}

CRITÈRE DE QUALITÉ : avant de publier un angle, demande-toi « serais-je fier que ça sorte devant un VC ? ». Si non, réécris.

GARDE-FOU ANTI-HALLUCINATION (impératif) :
- Ces exemples servent de référence de STYLE uniquement.
- NE recopie PAS les citations ni les noms de personnes présents dans les exemples.
- N'invente JAMAIS de citation attribuée à une personne réelle.
- Tu peux nommer des OUTILS ou des FAITS uniquement s'ils proviennent des résultats de recherche réels.`;
}
