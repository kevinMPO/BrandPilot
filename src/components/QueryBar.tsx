"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Play, Square, RotateCcw, Loader2, Sparkles, Lightbulb, Brain, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/hooks/useAgentStream";

const EXAMPLES = [
  "L'IA agentique en entreprise",
  "Le télétravail en 2026",
  "La sobriété numérique",
];

/**
 * Topic input + the three ways to launch a run:
 *   • Lancer l'agent — run on the typed topic.
 *   • Inspiration — let the agent propose ideas (uses your Company Brain + Linkup).
 *   • Company Brain — teach the agent who you are (opens the popup).
 *
 * `topic` is controlled by the parent so the Inspiration flow can prefill it.
 */
export function QueryBar({
  topic,
  setTopic,
  status,
  onRun,
  onStop,
  onReset,
  onOpenBrain,
  brainConfigured,
  onInspire,
  inspiring,
}: {
  topic: string;
  setTopic: (t: string) => void;
  status: RunStatus;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onOpenBrain: () => void;
  brainConfigured: boolean;
  onInspire: () => void;
  inspiring: boolean;
}) {
  const running = status === "running";
  const busy = running || inspiring;
  const canRun = topic.trim().length >= 3 && !busy;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canRun) onRun();
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Un sujet de post LinkedIn… ex : l'IA agentique en entreprise"
            className="pl-9"
            aria-label="Sujet du post LinkedIn"
            maxLength={280}
            disabled={busy}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onInspire}
            disabled={busy}
            aria-label="Trouver l'inspiration"
            title="Laissez l'agent vous proposer des idées, à partir de qui vous êtes"
          >
            {inspiring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
            Inspiration
          </Button>

          {running ? (
            <Button type="button" variant="destructive" onClick={onStop} aria-label="Arrêter l'agent">
              <Square className="h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button type="submit" variant="gradient" disabled={!canRun} aria-label="Lancer l'agent">
              <Play className="h-4 w-4" /> Lancer l&apos;agent
            </Button>
          )}
          {(status === "done" || status === "error") && (
            <Button type="button" variant="outline" size="icon" onClick={onReset} aria-label="Réinitialiser">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Company Brain trigger + status + examples */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenBrain}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            brainConfigured
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
              : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
          aria-label="Ouvrir Company Brain"
        >
          {brainConfigured ? <Check className="h-3.5 w-3.5" /> : <Brain className="h-3.5 w-3.5" />}
          {brainConfigured ? "Company Brain actif" : "Configurer votre Company Brain"}
        </button>

        <StatusPill status={status} inspiring={inspiring} />

        {!busy && status === "idle" && (
          <>
            <span className="text-xs text-muted-foreground">Essayer :</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setTopic(ex)}
                className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status, inspiring }: { status: RunStatus; inspiring: boolean }) {
  if (inspiring) {
    return (
      <motion.span
        key="inspiring"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Recherche d&apos;idées…
      </motion.span>
    );
  }

  const map: Record<RunStatus, { label: string; className: string; icon?: React.ReactNode }> = {
    idle: { label: "Prêt", className: "bg-secondary text-muted-foreground" },
    running: {
      label: "Agent en cours…",
      className: "bg-primary/15 text-primary",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    done: { label: "Terminé", className: "bg-emerald-500/15 text-emerald-400" },
    error: { label: "Erreur", className: "bg-destructive/15 text-destructive" },
  };
  const s = map[status];
  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}
    >
      {s.icon}
      {s.label}
    </motion.span>
  );
}
