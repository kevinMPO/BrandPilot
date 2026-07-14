"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, Search, ArrowRight, Loader2, Brain, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InspirationStatus } from "@/hooks/useInspirationStream";
import type { InspirationIdea, SearchResult } from "@/mastra/lib/schemas";

/**
 * INSPIRATION — the "propose me ideas" popup.
 * Shows the agent thinking live, its web searches, then selectable idea cards.
 * Picking one prefills the topic and launches the main agent.
 */
export function InspirationDialog({
  open,
  onOpenChange,
  status,
  reasoning,
  reasoningStreaming,
  searches,
  sources,
  ideas,
  errorMessage,
  brainConfigured,
  onSelect,
  onRetry,
  onOpenBrain,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: InspirationStatus;
  reasoning: string;
  reasoningStreaming: boolean;
  searches: string[];
  sources: SearchResult[];
  ideas: InspirationIdea[];
  errorMessage: string | null;
  brainConfigured: boolean;
  onSelect: (idea: InspirationIdea) => void;
  onRetry: () => void;
  onOpenBrain: () => void;
}) {
  const running = status === "running";
  const showSkeleton = running && ideas.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-2xl border border-border bg-card shadow-elevation-3",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Lightbulb className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="flex items-center gap-2 text-base font-semibold">
                Inspiration
                {running && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-amber-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> en direct
                  </span>
                )}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                L&apos;agent cherche des idées à partir de qui vous êtes. Choisissez-en une pour lancer un post.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {!brainConfigured && (
              <button
                type="button"
                onClick={onOpenBrain}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-primary/10"
              >
                <Brain className="h-4 w-4 text-primary" />
                <span>
                  <strong className="text-foreground">Astuce :</strong> configurez votre Company Brain pour des idées vraiment sur-mesure.
                </span>
              </button>
            )}

            {/* Live reasoning */}
            {(reasoning || running) && (
              <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--node-reasoning))]" />
                  Raisonnement
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {reasoning || "…"}
                  {reasoningStreaming && (
                    <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
                  )}
                </p>
              </div>
            )}

            {/* Searches */}
            {searches.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {searches.map((q, i) => (
                  <span
                    key={i}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Search className="h-3 w-3 shrink-0 text-[hsl(var(--node-action))]" />
                    <span className="truncate">{q}</span>
                  </span>
                ))}
                {sources.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                    {sources.length} source{sources.length > 1 ? "s" : ""} trouvée{sources.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {/* Ideas */}
            {status === "error" ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
                <p className="text-sm text-destructive">{errorMessage ?? "Une erreur est survenue."}</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RotateCcw className="h-4 w-4" /> Réessayer
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {showSkeleton &&
                  [0, 1, 2].map((i) => (
                    <div key={i} className="h-[74px] animate-pulse rounded-xl border border-border bg-secondary/30" />
                  ))}

                <AnimatePresence initial={false}>
                  {ideas.map((idea, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      onClick={() => onSelect(idea)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group flex w-full items-start gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.06]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {idea.angle}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-foreground">{idea.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{idea.rationale}</p>
                        {idea.sourceUrl && (
                          <a
                            href={idea.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="max-w-[220px] truncate">{idea.sourceTitle ?? idea.sourceUrl}</span>
                          </a>
                        )}
                      </div>
                      <span className="mt-0.5 flex shrink-0 items-center gap-1 self-center rounded-md border border-transparent px-2 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                        Lancer <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>

                {status === "done" && ideas.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Aucune idée générée. Réessayez ou complétez votre Company Brain.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">
              {running ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> L&apos;agent réfléchit…
                </span>
              ) : status === "done" ? (
                `${ideas.length} idée${ideas.length > 1 ? "s" : ""} · cliquez pour lancer`
              ) : (
                "Prêt"
              )}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {status === "done" && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RotateCcw className="h-4 w-4" /> Régénérer
                </Button>
              )}
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">Fermer</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
