import { runWebSearch, sleep } from "../tools/brightDataSearch";
import type { RunEmitter } from "./events";
import { isBrainMeaningful, type Angle, type CompanyBrain, type SearchResult } from "./schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DEMO AGENT — the zero-key fallback.
 *
 * When NO LLM key is set, we can't call a real model, but we still want the
 * live graph + 3 angles so the app is impressive out of the box. This function
 * SIMULATES a believable ReAct loop (think → search → observe → loop →
 * publish) through the very same RunEmitter, so the frontend can't tell the
 * difference. The web results are real mock data from the same search tool.
 *
 * The moment you add an LLM key, the route runs the REAL Mastra agent instead.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function runMockAgent(args: {
  topic: string;
  emitter: RunEmitter;
  avoid?: { themes: string[]; hooks: string[] };
  brain?: CompanyBrain;
}): Promise<Angle[]> {
  const { topic, emitter, avoid, brain } = args;
  const start = Date.now();
  const avoidNote =
    avoid && avoid.themes.length > 0
      ? ` (en évitant de répéter ce qu'on a déjà traité : ${avoid.themes.slice(0, 3).join(", ")})`
      : "";
  const voiceNote = isBrainMeaningful(brain)
    ? " Je garde votre profil en tête pour écrire dans votre voix."
    : "";

  // ── Round 1: anchor a data-driven angle ────────────────────────────────
  await typeReasoning(
    emitter,
    `Ok, je vais commencer ma réflexion sur « ${topic} »${avoidNote}.${voiceNote} Première intuition : pour accrocher, il me faut des chiffres récents et solides. Je vais donc chercher des données pour ancrer un premier angle factuel.`,
    1,
  );
  await sleep(400);
  emitter.action("brightDataSearch", `${topic} statistiques 2026`);
  const r1 = await runWebSearch(`${topic} statistiques chiffres 2026`, 4);
  emitter.observation(r1.results, r1.latencyMs);

  // ── Round 2: loop back — look for a contrarian angle ────────────────────
  await sleep(500);
  await typeReasoning(
    emitter,
    `Intéressant, j'ai de quoi faire côté chiffres. Mais ce serait trop plat : il me manque un angle contre-intuitif et un vrai retour d'expérience. Je relance une recherche, plus ciblée cette fois.`,
    2,
  );
  await sleep(350);
  emitter.action("brightDataSearch", `${topic} contre-intuitif limites retour d'expérience`);
  const r2 = await runWebSearch(`${topic} risques limites retour d'expérience`, 4);
  emitter.observation(r2.results, r2.latencyMs);

  // ── Round 3: decide we have enough and write ────────────────────────────
  await sleep(500);
  await typeReasoning(
    emitter,
    `Parfait, là j'ai assez de matière pour 3 angles vraiment différents : un factuel, un contre-intuitif, et un terrain. Je rédige et je publie.`,
    3,
  );
  await sleep(350);

  const pool = [...r1.results, ...r2.results];
  const angles = buildAngles(topic, pool).map((a) => ({ ...a, grounded: true }));
  angles.forEach((angle, i) => emitter.angle(i, angle));

  // ── Critique + fact-check pass (simulated): show the verify steps. ──
  await sleep(500);
  emitter.phase("critique", "🧑‍⚖️ Le critique relit + vérifie les faits…");
  for (let i = 0; i < angles.length; i++) {
    await sleep(350);
    const review = angles[i].review;
    if (review) {
      emitter.phase("scoring", `Angle ${i + 1} noté ${review.score}/100`, {
        detail: review.verdict,
        angleIndex: i,
        score: review.score,
      });
    }
    // Simulated fact-check: each point traced to one of the (mock) sources.
    emitter.verification(
      i,
      true,
      angles[i].points.map((p, k) => ({
        claim: p,
        supported: true,
        sourceUrl: angles[i].sources[k % Math.max(angles[i].sources.length, 1)],
        span: "extrait simulé à l'appui",
      })),
    );
  }
  await sleep(300);

  emitter.final({
    angles,
    steps: 3,
    durationMs: Date.now() - start,
  });
  return angles;
}

/**
 * Type out a reasoning line word-by-word so the demo reads like a human
 * thinking in real time (mirrors the real agent's token streaming).
 */
async function typeReasoning(
  emitter: RunEmitter,
  text: string,
  step: number,
): Promise<void> {
  const id = emitter.openReasoning(step);
  const words = text.split(" ");
  let acc = "";
  for (let i = 0; i < words.length; i++) {
    acc += (i === 0 ? "" : " ") + words[i];
    if (i % 2 === 0 || i === words.length - 1) {
      emitter.streamReasoning(id, acc, step, false);
      await sleep(45);
    }
  }
  emitter.streamReasoning(id, text, step, true);
}

/** Craft 3 differentiated angles, each backed by real (mock) source URLs. */
function buildAngles(topic: string, results: SearchResult[]): Angle[] {
  const url = (i: number) =>
    results[i % Math.max(results.length, 1)]?.url ?? "";
  const T = topic.trim();

  return [
    {
      hook: `Tout le monde parle de ${T}. Presque personne ne regarde les chiffres.`,
      points: [
        `Les données récentes montrent une adoption qui s'accélère plus vite que prévu.`,
        `Les organisations qui s'y mettent tôt mesurent un gain concret dès le 1er trimestre.`,
        `Le coût de l'attentisme devient supérieur au coût de l'expérimentation.`,
      ],
      cta: `Et vous, vous regardez les chiffres ou l'effet de mode ? 👇`,
      sources: [url(0), url(2)].filter(Boolean),
      review: { score: 88, verdict: "Hook fort et bien chiffré ; pense à citer la source clé dès la 2e ligne." },
    },
    {
      hook: `Impopulaire : ${T} ne résoudra pas votre vrai problème (et c'est tant mieux).`,
      points: [
        `L'angle contre-intuitif : la techno n'est qu'un amplificateur, pas une stratégie.`,
        `Les limites sont réelles — les ignorer, c'est préparer la prochaine désillusion.`,
        `Les garde-fous comptent autant que l'outil lui-même.`,
      ],
      cta: `Pas d'accord ? Dites-moi pourquoi en commentaire.`,
      sources: [url(4), url(1)].filter(Boolean),
      review: { score: 83, verdict: "Angle contrarian qui crée le débat ; le 3e point gagnerait à être plus concret." },
    },
    {
      hook: `90 jours avec ${T} : ce que j'aurais aimé savoir avant de commencer.`,
      points: [
        `Le retour d'expérience : les 2 erreurs que tout le monde fait au départ.`,
        `Le framework en 3 étapes qui a réellement fonctionné.`,
        `Ce qui change quand on arrête de chercher l'outil parfait.`,
      ],
      cta: `Je détaille le framework en commentaire si ça vous intéresse. ✋`,
      sources: [url(3)].filter(Boolean),
      review: { score: 91, verdict: "Format retour d'expérience très engageant ; excellent potentiel de partage." },
    },
  ];
}
