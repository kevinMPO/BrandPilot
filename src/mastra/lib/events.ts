import type { AgentEvent, Angle, ClaimCheck, SearchResult } from "./schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * RUN EMITTER — turns the agent's lifecycle into a stream of typed, *linked*
 * graph events.
 *
 * The graph topology (which node hangs off which, and when the loop closes)
 * is decided HERE, on the backend, so the frontend can stay dumb: it just
 * draws node -> sourceNodeId edges. Both the real Mastra agent and the demo
 * agent push through this same emitter, guaranteeing identical visuals.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type RawEmit = (event: AgentEvent) => void;

export class RunEmitter {
  private seq = 0;
  private lastNodeId?: string;
  private lastReasoningId?: string;
  private lastActionId?: string;
  /** Type of the most recent node — used to detect a re-search (loop). */
  private lastType?: AgentEvent["type"];
  /** Linking context of the reasoning node currently being streamed. */
  private streamCtx?: { sourceNodeId?: string; loop: boolean };

  constructor(private readonly raw: RawEmit) {}

  /** How many events have been emitted (used to decide a clean demo fallback). */
  get emitted(): number {
    return this.seq;
  }

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  /** Recalled memory (upstream root node): themes already covered. */
  memoryRecall(themes: string[], hooks: string[]): string {
    const id = this.nextId("memory");
    this.raw({
      type: "memory_recall",
      id,
      label: themes.length
        ? `Mémoire · ${themes.length} thèmes déjà couverts`
        : "Mémoire · premier run",
      sourceNodeId: this.lastNodeId,
      payload: { themes, hooks },
    });
    this.lastNodeId = id;
    this.lastType = "memory_recall";
    return id;
  }

  /** The model thinking / deciding (one-shot). Loop is detected automatically. */
  reasoning(text: string, step: number, tokens?: number): string {
    const id = this.nextId("reasoning");
    // If the previous node was an observation, this reasoning step is the
    // agent looping back to think again after seeing tool output.
    const loop = this.lastType === "observation";
    this.raw({
      type: "reasoning",
      id,
      label: summarize(text, 64),
      sourceNodeId: this.lastNodeId,
      loop,
      payload: { text, step, tokens },
    });
    this.lastReasoningId = id;
    this.lastNodeId = id;
    this.lastType = "reasoning";
    return id;
  }

  /**
   * STREAMED reasoning — open a node, then push text into it as it arrives so
   * it reads like a human typing in real time.
   */
  openReasoning(step: number): string {
    const id = this.nextId("reasoning");
    const loop = this.lastType === "observation";
    this.streamCtx = { sourceNodeId: this.lastNodeId, loop };
    this.raw({
      type: "reasoning",
      id,
      label: "…",
      sourceNodeId: this.streamCtx.sourceNodeId,
      loop,
      payload: { text: "", step, streaming: true },
    });
    this.lastReasoningId = id;
    this.lastNodeId = id;
    this.lastType = "reasoning";
    return id;
  }

  /** Push the latest accumulated text into the streaming reasoning node. */
  streamReasoning(id: string, text: string, step: number, done = false): void {
    this.raw({
      type: "reasoning",
      id,
      label: summarize(text, 64) || "…",
      sourceNodeId: this.streamCtx?.sourceNodeId,
      loop: this.streamCtx?.loop,
      payload: { text, step, streaming: !done },
    });
  }

  /** The model calls a tool. Branches off the current reasoning node. */
  action(tool: string, query: string): string {
    const id = this.nextId("action");
    this.raw({
      type: "action",
      id,
      label: query ? `🔎 ${summarize(query, 48)}` : `Appel ${tool}`,
      sourceNodeId: this.lastReasoningId ?? this.lastNodeId,
      payload: { tool, query },
    });
    this.lastActionId = id;
    this.lastNodeId = id;
    this.lastType = "action";
    return id;
  }

  /** A tool returned data. Hangs off its action node. */
  observation(results: SearchResult[], latencyMs: number): string {
    const id = this.nextId("observation");
    this.raw({
      type: "observation",
      id,
      label: `${results.length} résultat${results.length > 1 ? "s" : ""}`,
      sourceNodeId: this.lastActionId ?? this.lastNodeId,
      payload: { results, latencyMs },
    });
    this.lastNodeId = id;
    this.lastType = "observation";
    return id;
  }

  /**
   * A finished angle (leaf). Hangs off the final reasoning node.
   * The id is DETERMINISTIC (`angle-<index>`) so the critic pass can re-emit
   * the same node later to attach its score (upsert on the frontend).
   */
  angle(index: number, angle: Angle): string {
    const id = `angle-${index}`;
    this.raw({
      type: "angle",
      id,
      label: summarize(angle.hook, 56),
      sourceNodeId: this.lastReasoningId ?? this.lastNodeId,
      payload: { index, angle },
    });
    this.lastType = "angle";
    // Note: we do NOT advance lastNodeId here so multiple angles all branch
    // off the same reasoning node (a clean fan-out).
    return id;
  }

  /**
   * Fact-checking verdict for an angle. This IS a graph node, hanging off its
   * angle (deterministic id `verify-<index>` so it upserts after revision).
   */
  verification(angleIndex: number, grounded: boolean, claims: ClaimCheck[]): string {
    const id = `verify-${angleIndex}`;
    const unsupported = claims.filter((c) => !c.supported).length;
    this.raw({
      type: "verification",
      id,
      label: grounded
        ? "Ancrage ✓ faits sourcés"
        : `Ancrage ✗ ${unsupported} non sourcé${unsupported > 1 ? "s" : ""}`,
      sourceNodeId: `angle-${angleIndex}`,
      payload: { angleIndex, grounded, claims },
    });
    this.lastType = "verification";
    return id;
  }

  /**
   * A verify-pass step (critique / scoring / revision). These show up in the
   * timeline so the user SEES the agent reviewing and scoring — they are not
   * graph nodes (they don't touch the node-linking state).
   */
  phase(
    kind: "critique" | "scoring" | "revision",
    label: string,
    extra?: { detail?: string; angleIndex?: number; score?: number },
  ): string {
    const id = this.nextId("phase");
    this.raw({
      type: "phase",
      id,
      label,
      payload: { kind, ...extra },
    });
    return id;
  }

  /** Run finished successfully. */
  final(args: {
    angles: Angle[];
    steps: number;
    durationMs: number;
    totalTokens?: number;
  }): string {
    const id = this.nextId("final");
    this.raw({
      type: "final",
      id,
      label: "Terminé",
      payload: args,
    });
    return id;
  }

  /** Something went wrong — emitted cleanly, never a silent crash. */
  error(message: string): string {
    const id = this.nextId("error");
    this.raw({
      type: "error",
      id,
      label: "Erreur",
      sourceNodeId: this.lastNodeId,
      payload: { message },
    });
    return id;
  }
}

/** Trim text to a node-friendly one-liner. */
function summarize(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}
