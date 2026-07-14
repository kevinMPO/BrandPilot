// Evals runner — hors ligne, reproductible, hors du chemin de l'agent.
//   node evals/run.mjs   (alias: npm run evals)
// Scelle des sorties figées (fixtures), applique les 4 scorers, compare aux
// labels humains (vérité terrain) et écrit evals/report.json. Échoue (exit 1)
// si un score moyen passe sous un seuil — utilisable en CI (GitHub/GitLab) plus tard.
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { FIXTURES } from "./fixtures.mjs";
import { SCORERS } from "./scorers.mjs";

const AXES = ["differentiation", "sourceGrounded", "hookStrength", "voiceAlignment"];
const EVAL_THRESHOLDS = { differentiation: 50, sourceGrounded: 50, hookStrength: 45, voiceAlignment: 55, overall: 55 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const round = (n) => Math.round(n);
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);

const rows = [];
for (const fx of FIXTURES) {
  const scores = {};
  for (const axis of AXES) scores[axis] = SCORERS[axis](fx.angles).score;
  const overall = round(avg(AXES.map((a) => scores[a])));
  // Erreur absolue moyenne vs labels humains (proxy de corrélation/calibration).
  const mae = round(avg(AXES.map((a) => Math.abs(scores[a] - (fx.human?.[a] ?? scores[a])))));
  rows.push({ subjectId: fx.subjectId, scores, overall, humanOverall: fx.human?.note_globale ?? null, mae });
}

// Moyennes globales.
const meanAxis = {};
for (const axis of AXES) meanAxis[axis] = round(avg(rows.map((r) => r.scores[axis])));
const meanOverall = round(avg(rows.map((r) => r.overall)));
const meanMae = round(avg(rows.map((r) => r.mae)));

// Console.
console.log("\n=== EVALS (replay, hors ligne) ===\n");
for (const r of rows) {
  console.log(`• ${r.subjectId.padEnd(16)} ${AXES.map((a) => `${a}:${String(r.scores[a]).padStart(3)}`).join("  ")}  | global:${r.overall}  (humain:${r.humanOverall ?? "—"}, écart:${r.mae})`);
}
console.log("\n--- Moyennes ---");
console.log(AXES.map((a) => `${a}: ${meanAxis[a]}`).join("  |  "));
console.log(`Global moyen: ${meanOverall}/100  |  Écart moyen aux labels humains (MAE): ${meanMae}`);

// Seuils (CI gate).
const failures = [];
for (const axis of AXES) if (meanAxis[axis] < EVAL_THRESHOLDS[axis]) failures.push(`${axis} ${meanAxis[axis]}<${EVAL_THRESHOLDS[axis]}`);
if (meanOverall < EVAL_THRESHOLDS.overall) failures.push(`overall ${meanOverall}<${EVAL_THRESHOLDS.overall}`);

const report = { generatedFrom: "fixtures", rows, meanAxis, meanOverall, meanMae, thresholds: EVAL_THRESHOLDS, pass: failures.length === 0 };
writeFileSync(path.join(__dirname, "report.json"), JSON.stringify(report, null, 2));

if (failures.length) {
  console.log(`\n❌ ÉCHEC (régression) : ${failures.join(", ")}\n`);
  process.exit(1);
}
console.log("\n✅ OK — tous les seuils respectés. Rapport: evals/report.json\n");
