import { Mastra } from "@mastra/core";
import { createContentAgent } from "./agents/contentAgent";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE MASTRA INSTANCE — the runtime that registers the agent (and, later,
 * memory / a critic agent / more tools — all without touching the route).
 *
 * Built lazily: instantiating the agent resolves the LLM model, which needs
 * an API key. We only do that when credentials exist (the real path); the
 * demo path never touches this. This keeps `import` side-effect free.
 *
 * EXTENSION POINTS (wire here later, no refactor needed):
 *   • storage / memory  -> new Mastra({ storage, memory, ... })
 *   • a second "critic" agent -> agents: { contentAgent, criticAgent }
 *   • more MCP toolsets -> register on the agent or as toolsets
 * ─────────────────────────────────────────────────────────────────────────
 */

let mastra: Mastra | null = null;

export function getMastra(): Mastra {
  if (!mastra) {
    mastra = new Mastra({
      agents: { contentAgent: createContentAgent() },
    });
  }
  return mastra;
}
