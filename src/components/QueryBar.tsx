"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Play, Square, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RunStatus } from "@/hooks/useAgentStream";

const EXAMPLES = [
  "L'IA agentique en entreprise",
  "Le télétravail en 2026",
  "La sobriété numérique",
];

/**
 * Topic input + Run control. Reflects the run lifecycle
 * (idle / running / done / error) in the button and a small status pill.
 */
export function QueryBar({
  status,
  onRun,
  onStop,
  onReset,
}: {
  status: RunStatus;
  onRun: (topic: string) => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const [topic, setTopic] = React.useState("");
  const running = status === "running";
  const canRun = topic.trim().length >= 3 && !running;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canRun) onRun(topic.trim());
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
            disabled={running}
          />
        </div>

        <div className="flex items-center gap-2">
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

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={status} />
        {!running && status === "idle" && (
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

function StatusPill({ status }: { status: RunStatus }) {
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
