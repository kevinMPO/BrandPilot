"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import {
  X, CalendarClock, Trash2, Plus, Clock, Linkedin, Twitter, Instagram, Facebook, Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { networkLabel } from "@/mastra/lib/networks";
import type { ScheduledPost, SocialNetwork } from "@/mastra/lib/schemas";

const NET_ICON: Record<SocialNetwork, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
};

/**
 * PLANNER — a real publishing queue. Schedule a post (date/time) into your
 * queue; automatic publishing is the roadmap (needs each network's API).
 */
export function PlannerDialog({
  open,
  onOpenChange,
  draft,
  items,
  onAdd,
  onRemove,
  onDraftScheduled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: { network: SocialNetwork; text: string } | null;
  items: ScheduledPost[];
  onAdd: (input: { network: SocialNetwork; text: string; scheduledAt: string }) => void;
  onRemove: (id: string) => void;
  /** Called after a draft is added, so the parent can clear it. */
  onDraftScheduled: () => void;
}) {
  const [when, setWhen] = React.useState(defaultWhen());

  // Reset the picker each time a new draft is opened.
  React.useEffect(() => {
    if (open && draft) setWhen(defaultWhen());
  }, [open, draft]);

  const schedule = () => {
    if (!draft) return;
    if (!when) {
      toast.error("Choisissez une date et une heure.");
      return;
    }
    onAdd({ network: draft.network, text: draft.text, scheduledAt: when });
    toast.success("Post ajouté à votre file de publication 📅");
    onDraftScheduled();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[95vw] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-2xl border border-border bg-card shadow-elevation-3",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold">Planificateur</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                Votre file de publication. La publication automatique arrive bientôt.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Schedule a draft */}
            {draft && (
              <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Plus className="h-3.5 w-3.5" /> Programmer ce post
                  <NetworkBadge network={draft.network} />
                </div>
                <p className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background/50 p-2.5 text-xs leading-relaxed text-muted-foreground">
                  {draft.text.slice(0, 400)}
                  {draft.text.length > 400 ? "…" : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background/60 px-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Date et heure de publication"
                  />
                  <Button type="button" variant="gradient" size="sm" onClick={schedule}>
                    <CalendarClock className="h-4 w-4" /> Ajouter à la file
                  </Button>
                </div>
              </div>
            )}

            {/* Queue */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                File de publication {items.length > 0 && `· ${items.length}`}
              </p>
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucun post planifié. Générez un post puis cliquez « Planifier ».
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((post) => (
                    <li
                      key={post.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <NetworkBadge network={post.network} />
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatWhen(post.scheduledAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                          {post.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(post.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Retirer de la file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">
              🔜 Publication automatique — en construction.
            </span>
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                Fermer
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NetworkBadge({ network }: { network: SocialNetwork }) {
  const Icon = NET_ICON[network];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground">
      <Icon className="h-3 w-3" /> {networkLabel(network)}
    </span>
  );
}

function defaultWhen(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return toLocalInput(d);
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatWhen(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
