import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SHARED SCHEMAS — the single source of truth for the wire contract between
 * the backend (SSE route + agent) and the frontend (React Flow graph).
 *
 * Everything that crosses the network is validated against a Zod schema here.
 * The frontend imports the inferred TYPES (not the runtime code) so the graph
 * and the events can never drift apart.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * COMPANY BRAIN — who the author is. Captured once by the user (LinkedIn URL,
 * company URL, a concise description) and optionally enriched from the web via
 * Bright Data (`profile`). It is persisted client-side (localStorage) and sent
 * along with each run so every post is written FROM this person's perspective.
 * Every field is optional so a partial brain still helps.
 */
export const CompanyBrainSchema = z.object({
  /** LinkedIn profile or company page URL. */
  linkedinUrl: z.string().max(400).optional().default(""),
  /** Company website URL. */
  companyUrl: z.string().max(400).optional().default(""),
  /** A concise, human-written description of who you are / what you do. */
  description: z.string().max(2000).optional().default(""),
  /** Enriched author/brand profile, built from the web (Bright Data). Editable. */
  profile: z.string().max(4000).optional().default(""),
  /**
   * Guardrails — hard rules the agent must ALWAYS respect (e.g. "ne jamais
   * tutoyer", "pas d'emoji"). Injected as non-negotiable constraints so the
   * agent stops repeating things you don't want.
   */
  constraints: z.string().max(1500).optional().default(""),
  /** ISO date of the last save (for display / freshness). */
  updatedAt: z.string().optional(),
});
export type CompanyBrain = z.infer<typeof CompanyBrainSchema>;

/** True when a brain carries anything worth injecting into the agent. */
export function isBrainMeaningful(b?: CompanyBrain | null): boolean {
  if (!b) return false;
  return Boolean(
    (b.description && b.description.trim()) ||
      (b.profile && b.profile.trim()) ||
      (b.constraints && b.constraints.trim()) ||
      (b.linkedinUrl && b.linkedinUrl.trim()) ||
      (b.companyUrl && b.companyUrl.trim()),
  );
}

/** The request the QueryBar POSTs to /api/agent/stream. */
export const RunRequestSchema = z.object({
  topic: z
    .string()
    .min(3, "Le sujet doit faire au moins 3 caractères.")
    .max(280, "Le sujet est trop long (280 caractères max)."),
  /** Optional author/brand context, so the agent writes in the user's voice. */
  companyBrain: CompanyBrainSchema.optional(),
});
export type RunRequest = z.infer<typeof RunRequestSchema>;

/** Request to enrich a Company Brain from the web (POST /api/company-brain/enrich). */
export const EnrichRequestSchema = z.object({
  linkedinUrl: z.string().max(400).optional().default(""),
  companyUrl: z.string().max(400).optional().default(""),
  description: z.string().max(2000).optional().default(""),
});
export type EnrichRequest = z.infer<typeof EnrichRequestSchema>;

/** Result of a Company Brain enrichment. */
export const EnrichResponseSchema = z.object({
  /** A concise author/brand profile the user can review and edit. */
  profile: z.string(),
  /** URLs actually consulted to build the profile. */
  sources: z.array(z.string()),
  /** Whether real web data or a graceful fallback produced it. */
  source: z.enum(["bright-data", "mock"]),
});
export type EnrichResponse = z.infer<typeof EnrichResponseSchema>;

/** One real web result returned by the search tool (real OR mock — same shape). */
export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  /** Where the result came from, for transparency in the UI. */
  source: z.enum(["bright-data", "linkup", "mock"]),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

/** A single LinkedIn angle the agent produces. */
export const AngleSchema = z.object({
  /** Catchy first line that stops the scroll. */
  hook: z.string(),
  /** Exactly three supporting talking points. */
  points: z.array(z.string()).length(3),
  /** Call to action that ends the post. */
  cta: z.string(),
  /**
   * URLs (from real/mock search results) that back this angle.
   * If empty, the agent is telling us the angle is NOT source-backed.
   */
  sources: z.array(z.string()),
  /** Verdict from the critic agent (added after the main agent finishes). */
  review: z
    .object({
      score: z.number().min(0).max(100),
      verdict: z.string(),
    })
    .optional(),
  /** True if this angle was rewritten by the writer after a low critic score. */
  revised: z.boolean().optional(),
  /** Set by the fact-checker (Phase 2): every factual claim is source-backed. */
  grounded: z.boolean().optional(),
});
export type Angle = z.infer<typeof AngleSchema>;

/** One factual-claim check produced by the fact-verifier (Phase 2). */
export const ClaimCheckSchema = z.object({
  /** The factual assertion extracted from the angle. */
  claim: z.string(),
  /** True if a real search extract supports it. */
  supported: z.boolean(),
  /** URL of the supporting source (when supported). */
  sourceUrl: z.string().optional(),
  /** The exact passage from the extract that supports it. */
  span: z.string().optional(),
});
export type ClaimCheck = z.infer<typeof ClaimCheckSchema>;

/**
 * Node lifecycle status, drives the visual state of a graph node.
 * running -> pulsing halo, done -> settled, error -> red.
 */
export const NodeStatusSchema = z.enum(["running", "done", "error"]);
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

/** The discrete kinds of events the agent emits, one per turn of the loop. */
export const EventTypeSchema = z.enum([
  "memory_recall", // recalled past themes (upstream node) — non-repetition
  "reasoning", // the model is thinking / deciding what to do next
  "action", // the model calls a tool (e.g. Bright Data search)
  "observation", // the tool returned data
  "angle", // a finished LinkedIn angle (leaf node)
  "verification", // fact-checking verdict for an angle (graph node)
  "phase", // a verify-pass step (critique / scoring / revision) — timeline only
  "final", // run finished successfully
  "error", // something went wrong (emitted cleanly, never a silent crash)
]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * The discriminated union of every SSE event. `payload` is event-specific.
 * `sourceNodeId` lets the backend tell the frontend exactly which node this
 * one hangs off — this is how the loop is drawn deterministically.
 */
export const AgentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("memory_recall"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      themes: z.array(z.string()),
      hooks: z.array(z.string()),
    }),
  }),
  z.object({
    type: z.literal("reasoning"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    /** True when this reasoning step closes a loop (re-search after observing). */
    loop: z.boolean().optional(),
    payload: z.object({
      text: z.string(),
      step: z.number(),
      tokens: z.number().optional(),
      /** True while the text is still streaming in (shows a typing cursor). */
      streaming: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal("action"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      tool: z.string(),
      query: z.string(),
    }),
  }),
  z.object({
    type: z.literal("observation"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      results: z.array(SearchResultSchema),
      /** Tool latency in ms, surfaced as a badge on the node. */
      latencyMs: z.number(),
    }),
  }),
  z.object({
    type: z.literal("angle"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      index: z.number(),
      angle: AngleSchema,
    }),
  }),
  z.object({
    type: z.literal("verification"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      angleIndex: z.number(),
      grounded: z.boolean(),
      claims: z.array(ClaimCheckSchema),
    }),
  }),
  z.object({
    type: z.literal("phase"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      kind: z.enum(["critique", "scoring", "revision"]),
      detail: z.string().optional(),
      angleIndex: z.number().optional(),
      score: z.number().optional(),
    }),
  }),
  z.object({
    type: z.literal("final"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      angles: z.array(AngleSchema),
      totalTokens: z.number().optional(),
      steps: z.number(),
      durationMs: z.number(),
    }),
  }),
  z.object({
    type: z.literal("error"),
    id: z.string(),
    label: z.string(),
    sourceNodeId: z.string().optional(),
    payload: z.object({
      message: z.string(),
    }),
  }),
]);
export type AgentEvent = z.infer<typeof AgentEventSchema>;

/** Narrow helper: get the payload type for a given event type. */
export type AgentEventOf<T extends EventType> = Extract<AgentEvent, { type: T }>;

/* ─────────────────────────────────────────────────────────────────────────
 * INSPIRATION — the "propose me ideas" flow (Linkup + Company Brain).
 * A lightweight live stream: the agent reasons out loud, searches the web,
 * and proposes selectable post ideas. Selecting one prefills the topic and
 * launches the main agent.
 * ───────────────────────────────────────────────────────────────────────── */

/** One selectable post idea the inspiration agent proposes. */
export const InspirationIdeaSchema = z.object({
  /** Catchy idea / working hook for the post. */
  title: z.string(),
  /** The angle family, e.g. "Data-driven", "Contre-intuitif", "Retour d'expérience". */
  angle: z.string(),
  /** One line: why this resonates for THIS author, right now. */
  rationale: z.string(),
  /** Optional backing article (from Linkup). */
  sourceTitle: z.string().optional(),
  sourceUrl: z.string().optional(),
});
export type InspirationIdea = z.infer<typeof InspirationIdeaSchema>;

/** Request the Inspiration panel POSTs to /api/inspiration/stream. */
export const InspirationRequestSchema = z.object({
  companyBrain: CompanyBrainSchema.optional(),
});
export type InspirationRequest = z.infer<typeof InspirationRequestSchema>;

/** Events streamed by the inspiration run (its own small wire contract). */
export const InspirationEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reasoning"),
    id: z.string(),
    payload: z.object({ text: z.string(), streaming: z.boolean().optional() }),
  }),
  z.object({
    type: z.literal("search"),
    id: z.string(),
    payload: z.object({ query: z.string() }),
  }),
  z.object({
    type: z.literal("sources"),
    id: z.string(),
    payload: z.object({ results: z.array(SearchResultSchema) }),
  }),
  z.object({
    type: z.literal("idea"),
    id: z.string(),
    payload: z.object({ index: z.number(), idea: InspirationIdeaSchema }),
  }),
  z.object({
    type: z.literal("done"),
    id: z.string(),
    payload: z.object({ count: z.number() }),
  }),
  z.object({
    type: z.literal("error"),
    id: z.string(),
    payload: z.object({ message: z.string() }),
  }),
]);
export type InspirationEvent = z.infer<typeof InspirationEventSchema>;
