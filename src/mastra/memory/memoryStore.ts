import { promises as fs } from "fs";
import path from "path";

/**
 * Lightweight, dependency-free memory (JSON file). Recall is a fast sync-ish
 * read BEFORE the run (negligible latency); recording happens AFTER the run.
 * Swap for @mastra/memory + LibSQL/Postgres later without touching callers.
 * Path via MEMORY_PATH env (default .mastra/memory.json) — no secret in code.
 */
const MEMORY_PATH = process.env.MEMORY_PATH || path.join(process.cwd(), ".mastra", "memory.json");

export interface RunRecord {
  subject: string;
  hooks: string[];
  themes: string[];
  date: string;
}

async function load(): Promise<RunRecord[]> {
  try {
    return JSON.parse(await fs.readFile(MEMORY_PATH, "utf8")) as RunRecord[];
  } catch {
    return [];
  }
}

/** Themes + hooks already covered (most recent first), for non-repetition. */
export async function recallCovered(): Promise<{ themes: string[]; hooks: string[] }> {
  const recent = (await load()).slice(-8).reverse();
  return {
    themes: [...new Set(recent.flatMap((r) => r.themes))].slice(0, 12),
    hooks: recent.flatMap((r) => r.hooks).slice(0, 10),
  };
}

export async function recordRun(rec: RunRecord): Promise<void> {
  try {
    const runs = await load();
    runs.push(rec);
    await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
    await fs.writeFile(MEMORY_PATH, JSON.stringify(runs.slice(-50), null, 2));
  } catch {
    /* memory is best-effort — never fail a run because of it */
  }
}

/** Crude theme extraction from a subject (keywords). */
export function extractThemes(subject: string): string[] {
  return subject
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9]+/)
    .filter((w) => w.length > 3)
    .slice(0, 6);
}
