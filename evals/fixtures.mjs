// Cassettes FIGÉES + labels humains (Phase 3). Le web change à chaque appel :
// figer des sorties d'angles ici rend les evals 100% reproductibles, hors ligne,
// sans réseau ni clé. `human` = notes /100 attribuées à la main (vérité terrain),
// servant à CALIBRER les scorers. Les posts de voice-corpus sont l'ancre "haut".
export const FIXTURES = [
  {
    subjectId: "souv-ia-pme",
    angles: [
      {
        hook: "31% des PME françaises utilisent l'IA générative — mais l'écart avec celles qui en tirent de la valeur est béant.",
        points: [
          "L'adoption ne suffit pas : la data souveraine fait la différence sur la performance.",
          "Les early adopters mesurent un gain dès le premier trimestre.",
          "Le coût de l'attentisme dépasse celui de l'expérimentation.",
        ],
        cta: "Vous regardez les chiffres ou l'effet de mode ?",
        sources: ["https://lelab.bpifrance.fr/31-des-tpe-et-pme-utilisent-l-ia-generative/"],
        grounded: true,
      },
      {
        hook: "Souveraineté numérique : vos données PME tournent sur des clouds dont vous ne maîtrisez pas la juridiction.",
        points: [
          "La préférence européenne n'est pas un slogan, c'est un choix d'architecture.",
          "Data FR/EU = avantage compétitif, pas contrainte réglementaire.",
          "Les territoires gagnent en employabilité quand l'IA reste souveraine.",
        ],
        cta: "On en parle en commentaire.",
        sources: ["https://www.oecd.org/fr/"],
        grounded: true,
      },
      {
        hook: "Un stack IA souverain pour une PME, ça ressemble à quoi concrètement ? On a testé.",
        points: [
          "Prospection, veille marchés publics, pilotage du risque : un copilote par département.",
          "Prototype avant concept : un agent qui agit > une idée non codée.",
          "Résultat : moins de défaillances, plus de croissance.",
        ],
        cta: "Je détaille le framework si ça intéresse.",
        sources: ["https://www.intescia.com"],
        grounded: true,
      },
    ],
    human: {
      differentiation: 85,
      sourceGrounded: 90,
      hookStrength: 88,
      voiceAlignment: 92,
      note_globale: 89,
      comment: "Très dans la voix, angles distincts, bien sourcés.",
    },
  },
  {
    subjectId: "agents-sales",
    angles: [
      {
        hook: "BREAKING: les agents IA vont tuer le métier de commercial.",
        points: ["Affirmation choc sans source.", "Pas de nuance.", "Pas de preuve."],
        cta: "Commente AGENT pour recevoir le guide.",
        sources: [],
        grounded: false,
      },
      {
        hook: "Devenir un Iron Man du Sales & Growth avec ses agents IA.",
        points: [
          "POC réel : un employé virtuel boosté aux APIs de data B2B.",
          "Mission : libérer les solopreneurs de la prospection chronophage.",
          "Bénéfice client clair, mesurable.",
        ],
        cta: "Retour d'expérience en commentaire.",
        sources: ["https://www.societeinfo.com"],
        grounded: true,
      },
      {
        hook: "Les agents IA appliqués au Sales & Growth, ce n'est que le début.",
        points: [
          "Du lead scoring à l'engagement, le pipeline devient agentique.",
          "L'humain garde la relation, l'agent fait le répétitif.",
          "La data FR/EU nourrit des agents plus pertinents.",
        ],
        cta: "Vous testez quoi en ce moment ?",
        sources: ["https://www.intescia.com"],
        grounded: true,
      },
    ],
    human: {
      differentiation: 70,
      sourceGrounded: 55,
      hookStrength: 40,
      voiceAlignment: 60,
      note_globale: 56,
      comment: "Angle 1 est du bait non sourcé (à recaler) ; les deux autres sont bons.",
    },
  },
];
