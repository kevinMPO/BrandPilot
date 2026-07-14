/**
 * ─────────────────────────────────────────────────────────────────────────
 * VOICE CORPUS — la SOURCE DE VÉRITÉ PARTAGÉE de la VOIX de l'auteur.
 *
 * Ce fichier est utilisé à DEUX endroits :
 *   • le few-shot (génération) — contentAgent + reviserAgent l'injectent ;
 *   • les evals (mesure) — le scorer `voiceAlignment` s'y réfère (Phase 3).
 *
 * IMPORTANT : « structure » ≠ « voix ». Ici on capture la VOIX (ton, thèmes,
 * valeurs). Le gabarit de mise en forme neutre vit dans `structure-pattern.ts`.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface VoiceExemplar {
  /** Un post réel exemplaire de la voix. */
  text: string;
  /** 1-2 lignes : POURQUOI ce post marche (hook, structure, registre). */
  annotation: string;
}

/** Traits EXPLICITES de la voix à incarner. */
export const VOICE_TRAITS: string[] = [
  "Souveraineté & data FR/EU au service de la performance des entreprises",
  "Concret et opérationnel, jamais hype ni jargon creux",
  "Bias-to-action agentique : « un agent qui agit > une idée brillante non codée »",
  "S'appuie sur des POC réels, en nommant les vrais outils utilisés",
  "Crédit généreux à l'écosystème, aux équipes et aux personnes",
  "Ton mobilisateur et fédérateur, qui rassemble vers une ambition commune",
  "Touches bilingues FR/EN assumées",
  "Ancrage French Tech / écosystème européen",
];

/**
 * INTERDITS DURS — tournures « bait » à ne JAMAIS produire. Servent aussi de
 * règle dure au scorer `hookStrength` (Phase 3).
 */
export const ANTI_VOICE: string[] = [
  '« BREAKING: » ou toute fausse annonce sensationnaliste',
  '« This is OVER » et autres formules-choc creuses',
  "Gating d'engagement (« commente MOT pour recevoir… »)",
  '« repost = accès prioritaire » comme mécanique',
  "Fausses urgences / FOMO artificiel",
  "Affirmations chiffrées non sourcées",
  "Promesses du type « indétectable par un humain »",
];

/** Les exemplaires annotés de la voix (few-shot). */
export const VOICE_CORPUS: VoiceExemplar[] = [
  {
    text: `Rencontres IA à Bercy, côté ETIncelles. Un message fort entendu aujourd'hui : l'IA doit être concrète, utile et opérationnelle. Souveraineté numérique, préférence européenne, diffusion massive de l'IA dans nos PME et ETI. Chez Intescia, nous portons exactement cette ambition : mettre la richesse de la data française et européenne au service de la performance des entreprises. Prospection, veille marchés publics, sales engagement, pilotage du risque : l'IA doit devenir un copilote du CEO, du marketing, du commercial et du risk manager. Si nous intégrons l'IA dans tous les départements, alors nous pouvons viser plus haut : moins de défaillances, plus de croissance, plus d'employabilité sur nos territoires. L'Europe a les talents, la data et l'ambition. À nous d'allumer le feu.`,
    annotation:
      "Ouverture ancrée dans un moment réel, thèse souveraineté assumée, liste concrète des cas d'usage (pas d'abstraction), chute mobilisatrice courte. Crédit aux acteurs de l'écosystème.",
  },
  {
    text: `Super Hackathon Agents IA chez Intescia. 10 équipes pluridisciplinaires, 24 heures pour imaginer, prototyper et tester un agent IA réellement utile. Trois minutes de pitch, deux minutes de Q&A, façon Y Combinator. Règles du jeu : un agent, une mission. Prototype avant concept : mieux vaut un agent qui agit qu'une idée brillante non codée. Collaboration totale, sans spectateurs. No limits, just build. Le plaisir de créer comme moteur du résultat. Critères du jury : impact, clarté, exécution et esprit d'équipe.`,
    annotation:
      "Éthos de builder, valorise l'exécution sur l'idée, rythme en règles courtes et mémorables, énergie d'équipe. La phrase « un agent qui agit > une idée non codée » est une signature.",
  },
  {
    text: `Thank you Make for a great event in Paris, proud to win with our AI Agent powered by Societeinfo data. Hier soir à Paris, +300 participants au Hackathon IA. Managers, dirigeants, entrepreneurs réunis pour une seule raison : devenir des Iron Man du Sales & Growth avec leurs agents IA. On a relevé le défi : créer un employé virtuel IA boosté aux APIs de Societeinfo. Mission du POC : libérer les solopreneurs de la prospection chronophage. Verdict : victoire, et déjà plusieurs personnes intéressées. Et ce n'est que le début des agents IA appliqués au Sales & Growth.`,
    annotation:
      "Preuve par le POC gagné, nomme le vrai outil (Societeinfo), métaphore parlante (Iron Man), bénéfice client clair (libérer de la prospection), intro bilingue assumée.",
  },
];
