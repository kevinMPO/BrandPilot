"use client";

import { motion } from "framer-motion";
import { X, ExternalLink, Timer, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentEvent } from "@/mastra/lib/schemas";

/**
 * Floating detail panel shown when a graph node is clicked. Reveals the full
 * content behind a node: complete reasoning text, every search result with its
 * URL, or the full angle + critic verdict.
 */
export function NodeDetail({
  event,
  onClose,
}: {
  event: AgentEvent;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="absolute left-3 top-3 z-30 w-[min(92vw,360px)] rounded-card border border-border bg-card/95 shadow-elevation-3 backdrop-blur"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold">{titleFor(event)}</h3>
        <button
          onClick={onClose}
          aria-label="Fermer le détail"
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="max-h-[50vh]">
        <div className="space-y-2 p-3 text-xs leading-relaxed">{bodyFor(event)}</div>
      </ScrollArea>
    </motion.div>
  );
}

function titleFor(event: AgentEvent): string {
  switch (event.type) {
    case "reasoning":
      return event.loop ? "Raisonnement · re-recherche" : "Raisonnement";
    case "action":
      return "Recherche web";
    case "observation":
      return `${event.payload.results.length} résultats`;
    case "angle":
      return `Angle ${event.payload.index + 1}`;
    case "verification":
      return event.payload.grounded ? "Ancrage des faits ✓" : "Ancrage incomplet ✗";
    default:
      return "Détail";
  }
}

function bodyFor(event: AgentEvent) {
  switch (event.type) {
    case "memory_recall":
      return (
        <div className="space-y-1.5">
          <p className="text-foreground/90">
            {event.payload.themes.length
              ? "Thèmes déjà couverts lors de runs précédents (l'agent doit proposer du neuf) :"
              : "Aucun run antérieur en mémoire — l'agent part d'une page blanche."}
          </p>
          {event.payload.themes.map((t, i) => (
            <span key={i} className="mr-1 inline-block rounded bg-secondary/60 px-1.5 py-0.5 text-[10px]">
              {t}
            </span>
          ))}
        </div>
      );
    case "reasoning":
      return <p className="text-foreground/90">{event.payload.text}</p>;

    case "action":
      return (
        <div className="space-y-1.5">
          <Field label="Outil" value={event.payload.tool} />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Requête</p>
            <p className="mt-0.5 rounded-md bg-secondary/60 px-2 py-1 font-mono text-[11px]">
              {event.payload.query}
            </p>
          </div>
        </div>
      );

    case "observation":
      return (
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Timer className="h-3 w-3" /> {event.payload.latencyMs} ms ·{" "}
            {event.payload.results[0]?.source === "mock" ? "simulé" : "Bright Data réel"}
          </span>
          {event.payload.results.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border p-2 transition-colors hover:border-primary/50 hover:bg-secondary/40"
            >
              <p className="flex items-center gap-1 font-medium text-foreground">
                <ExternalLink className="h-3 w-3 shrink-0 text-primary" />
                <span className="line-clamp-1">{r.title}</span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground">{r.snippet}</p>
            </a>
          ))}
        </div>
      );

    case "angle": {
      const a = event.payload.angle;
      return (
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{a.hook}</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            {a.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
          <p className="font-medium text-foreground/90">{a.cta}</p>
          {a.review && (
            <p className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Critique : {a.review.score}/100 — {a.review.verdict}
            </p>
          )}
          {a.sources.length > 0 && (
            <div className="border-t border-border pt-1.5">
              {a.sources.map((s, i) => (
                <a
                  key={i}
                  href={s}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-[10px] text-muted-foreground hover:text-primary"
                >
                  {s}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "verification":
      return (
        <div className="space-y-2">
          <p className={event.payload.grounded ? "text-node-verify" : "text-destructive"}>
            {event.payload.grounded
              ? "Toutes les affirmations factuelles sont soutenues par une source réelle."
              : "Une ou plusieurs affirmations ne sont pas soutenues → renvoyé en révision."}
          </p>
          {event.payload.claims.length === 0 && (
            <p className="text-muted-foreground">Aucune affirmation factuelle à vérifier.</p>
          )}
          {event.payload.claims.map((c, i) => (
            <div key={i} className="rounded-lg border border-border p-2">
              <p className="flex items-start gap-1.5">
                <span className={c.supported ? "text-node-verify" : "text-destructive"}>
                  {c.supported ? "✓" : "✗"}
                </span>
                <span className="text-foreground">{c.claim}</span>
              </p>
              {c.supported && c.span && (
                <p className="mt-1 border-l-2 border-node-verify/40 pl-2 text-[10px] italic text-muted-foreground">
                  « {c.span} »
                </p>
              )}
              {c.supported && c.sourceUrl && (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block truncate text-[10px] text-muted-foreground hover:text-primary"
                >
                  {c.sourceUrl}
                </a>
              )}
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground/90">{value}</p>
    </div>
  );
}
