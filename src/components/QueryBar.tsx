"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Play, Square, RotateCcw, Loader2, Sparkles, Lightbulb, Brain, Check,
  ChevronDown, Linkedin, Instagram, Twitter, Facebook, Music2, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/hooks/useAgentStream";

const EXAMPLES = [
  "L'IA agentique en entreprise",
  "Le télétravail en 2026",
  "La sobriété numérique",
];

/** Social networks. Only LinkedIn is live; the rest are a visible waitlist. */
const NETWORKS = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, ready: true },
  { key: "instagram", label: "Instagram", Icon: Instagram, ready: false },
  { key: "tiktok", label: "TikTok", Icon: Music2, ready: false },
  { key: "twitter", label: "Twitter / X", Icon: Twitter, ready: false },
  { key: "facebook", label: "Facebook", Icon: Facebook, ready: false },
] as const;

/**
 * Topic input + the ways to launch:
 *   • Lancer l'agent IA — opens a network picker (LinkedIn live, others waitlisted).
 *   • Inspiration — the agent proposes ideas from who you are.
 *   • Lancer le planificateur — disabled (roadmap).
 *   • Company Brain — teach the agent who you are.
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
            placeholder="Un sujet de post… ex : l'IA agentique en entreprise"
            className="pl-9"
            aria-label="Sujet du post"
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
            <NetworkLaunch canRun={canRun} onRun={onRun} />
          )}

          {(status === "done" || status === "error") && (
            <Button type="button" variant="outline" size="icon" onClick={onReset} aria-label="Réinitialiser">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Planner (roadmap) — under the launch controls */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Bientôt : planifiez la publication automatique de vos posts"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-dashed border-border bg-secondary/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60"
        >
          <CalendarClock className="h-3.5 w-3.5" /> Lancer le planificateur
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
            Bientôt
          </span>
        </button>
      </div>

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

/** The launch button — opens a network picker. LinkedIn runs; others are waitlisted. */
function NetworkLaunch({ canRun, onRun }: { canRun: boolean; onRun: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="gradient"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Lancer l'agent IA — choisir un réseau"
      >
        <Play className="h-4 w-4" /> Lancer l&apos;agent IA
        <ChevronDown className={cn("h-4 w-4 opacity-80 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-elevation-3"
        >
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Publier sur…
          </p>
          {NETWORKS.map(({ key, label, Icon, ready }) =>
            ready ? (
              <button
                key={key}
                type="button"
                role="menuitem"
                disabled={!canRun}
                onClick={() => {
                  setOpen(false);
                  onRun();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                title={!canRun ? "Entrez d'abord un sujet (3 caractères min.)" : undefined}
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
                {canRun ? (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                ) : (
                  <span className="ml-auto text-[10px] text-muted-foreground">sujet requis</span>
                )}
              </button>
            ) : (
              <div
                key={key}
                aria-disabled="true"
                className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground/50"
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className="ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Bientôt
                </span>
              </div>
            ),
          )}
        </div>
      )}
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
