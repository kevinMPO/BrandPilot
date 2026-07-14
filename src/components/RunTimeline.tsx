"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Globe,
  Database,
  Sparkles,
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
  Gavel,
  Star,
  PenLine,
  Coins,
  Timer,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AgentEvent } from "@/mastra/lib/schemas";

/** Event types that appear as a row in the timeline. */
const STEP_TYPES = ["memory_recall", "reasoning", "action", "observation", "angle", "verification", "phase"] as const;
type StepEvent = AgentEvent & { type: (typeof STEP_TYPES)[number] };

/** Per-step icon, color and sub-label, derived from the event. */
function stepVisual(e: StepEvent): {
  Icon: LucideIcon;
  color: string;
  label: string;
  sub?: string;
} {
  switch (e.type) {
    case "memory_recall":
      return {
        Icon: BrainCircuit,
        color: "text-node-memory",
        label: e.label,
        sub: e.payload.themes.length ? e.payload.themes.slice(0, 4).join(", ") : "premier run",
      };
    case "reasoning":
      return {
        Icon: Brain,
        color: "text-node-reasoning",
        label: e.payload.text || e.label,
        sub: e.payload.streaming ? "réflexion en cours…" : `étape ${e.payload.step}`,
      };
    case "action":
      return { Icon: Globe, color: "text-node-action", label: e.label, sub: "recherche web" };
    case "observation":
      return {
        Icon: Database,
        color: "text-node-observation",
        label: e.label,
        sub: `${e.payload.latencyMs} ms`,
      };
    case "angle":
      return {
        Icon: Sparkles,
        color: "text-node-angle",
        label: e.label,
        sub: e.payload.angle.review
          ? `${e.payload.angle.review.score}/100${e.payload.angle.revised ? " · révisé ✦" : ""}`
          : `angle ${e.payload.index + 1}`,
      };
    case "verification":
      return {
        Icon: e.payload.grounded ? ShieldCheck : ShieldAlert,
        color: e.payload.grounded ? "text-node-verify" : "text-destructive",
        label: e.label,
        sub: `${e.payload.claims.filter((c) => c.supported).length}/${e.payload.claims.length} faits sourcés`,
      };
    case "phase": {
      const map = {
        critique: { Icon: Gavel, color: "text-amber-400" },
        scoring: { Icon: Star, color: "text-emerald-400" },
        revision: { Icon: PenLine, color: "text-node-reasoning" },
      } as const;
      const v = map[e.payload.kind];
      return { Icon: v.Icon, color: v.color, label: e.label, sub: e.payload.detail };
    }
  }
}

/**
 * Chronological sidebar of the agent's steps, synced with the graph.
 * Shows reasoning, searches, observations, the 3 angles AND the verify pass
 * (critique / scoring / revision). Clicking a graph-backed step focuses its node.
 */
export function RunTimeline({
  events,
  selectedNodeId,
  onSelect,
}: {
  events: AgentEvent[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
}) {
  // Dedupe by id (streaming emits the same reasoning id many times; keep the
  // latest so we show one row per step, not one per token batch).
  const stepMap = new Map<string, StepEvent>();
  for (const e of events) {
    if ((STEP_TYPES as readonly string[]).includes(e.type)) stepMap.set(e.id, e as StepEvent);
  }
  const steps = [...stepMap.values()];

  const finalEvent = events.find((e) => e.type === "final");
  const totalTokens = finalEvent?.type === "final" ? finalEvent.payload.totalTokens : undefined;
  const totalLatency = events.reduce(
    (acc, e) => acc + (e.type === "observation" ? e.payload.latencyMs : 0),
    0,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Déroulé</h2>
        <span className="ml-auto text-xs text-muted-foreground">{steps.length} étapes</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ol className="space-y-1 p-3">
          <AnimatePresence initial={false}>
            {steps.map((step, i) => {
              const { Icon, color, label, sub } = stepVisual(step);
              // Only graph-backed steps are clickable (phase steps aren't nodes).
              const clickable = step.type !== "phase";
              const selected = step.id === selectedNodeId;
              return (
                <motion.li
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && onSelect(step.id)}
                    className={cn(
                      "group flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      clickable && "hover:bg-secondary/60",
                      selected && "border-border bg-secondary",
                    )}
                  >
                    <span className="mt-0.5 flex flex-col items-center">
                      <Icon className={cn("h-4 w-4 shrink-0", color)} />
                      {i < steps.length - 1 && (
                        <span className="mt-1 h-4 w-px bg-border" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="line-clamp-2 break-words text-xs font-medium leading-snug">
                        {label}
                      </span>
                      {sub && (
                        <span className="mt-0.5 line-clamp-1 break-words text-[10px] text-muted-foreground">
                          {sub}
                        </span>
                      )}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {steps.length === 0 && (
            <li className="px-2 py-6 text-center text-xs text-muted-foreground">
              Les étapes de l&apos;agent apparaîtront ici.
            </li>
          )}
        </ol>
      </ScrollArea>

      <div className="grid grid-cols-2 gap-2 border-t border-border p-3 text-xs">
        <Metric icon={Coins} label="Tokens" value={totalTokens != null ? totalTokens.toLocaleString("fr-FR") : "—"} />
        <Metric icon={Timer} label="Latence outils" value={totalLatency > 0 ? `${totalLatency} ms` : "—"} />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/50 px-3 py-2">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="mt-0.5 block font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}
