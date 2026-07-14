"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Sparkles, CheckCircle2, Pencil, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPostForNetwork, networkLabel } from "@/mastra/lib/networks";
import type { Angle, SocialNetwork } from "@/mastra/lib/schemas";

/** The finished angles: editable, network-formatted, copyable, schedulable. */
export function ResultPanel({
  angles,
  network = "linkedin",
  onPlan,
}: {
  angles: Angle[];
  network?: SocialNetwork;
  onPlan?: (input: { network: SocialNetwork; text: string }) => void;
}) {
  if (angles.length === 0) return null;

  return (
    <section aria-label="Angles générés" className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Sparkles className="h-4 w-4 text-node-angle" />
        {angles.length} angles prêts à publier
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
          {networkLabel(network)}
        </span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {angles.map((angle, i) => (
          <AngleCard key={i} angle={angle} index={i} network={network} onPlan={onPlan} />
        ))}
      </div>
    </section>
  );
}

function AngleCard({
  angle,
  index,
  network,
  onPlan,
}: {
  angle: Angle;
  index: number;
  network: SocialNetwork;
  onPlan?: (input: { network: SocialNetwork; text: string }) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(() => formatPostForNetwork(angle, network));
  // Once the user edits, we stop overwriting their text with upstream upserts
  // (the angle re-emits after the critique/revision pass) or a network change.
  const editedRef = React.useRef(false);

  React.useEffect(() => {
    if (!editedRef.current) setDraft(formatPostForNetwork(angle, network));
  }, [angle, network]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast.success("Post copié dans le presse-papiers ✨");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le post.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card className="flex h-full flex-col border-node-angle/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-node-angle/15 px-2 py-0.5 text-[11px] font-semibold text-node-angle">
              Angle {index + 1}
              {editedRef.current && (
                <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">modifié</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing((e) => !e)}
                className="h-7 gap-1.5 px-2 text-xs"
                aria-label={editing ? "Terminer l'édition" : "Modifier le texte du post"}
              >
                {editing ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Terminer" : "Modifier"}
              </Button>
              <Button variant="ghost" size="sm" onClick={copy} className="h-7 gap-1.5 px-2 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 pt-0">
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => {
                editedRef.current = true;
                setDraft(e.target.value);
              }}
              rows={10}
              aria-label={`Texte du post ${index + 1}`}
              className="min-h-[220px] w-full flex-1 resize-y rounded-md border border-input bg-background/60 px-3 py-2 text-sm leading-relaxed ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          ) : (
            <>
              <p className="font-semibold leading-snug">{angle.hook}</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {angle.points.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-node-angle" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-medium text-foreground/90">{angle.cta}</p>
            </>
          )}

          {angle.review && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Critique IA · {angle.review.score}/100
                {angle.revised && (
                  <span className="rounded-full bg-node-reasoning/15 px-1.5 py-0.5 text-[10px] text-node-reasoning">
                    réécrit après critique ✦
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {angle.review.verdict}
              </p>
            </div>
          )}

          {angle.grounded !== undefined && (
            <p
              className={
                angle.grounded
                  ? "flex items-center gap-1 text-[11px] font-medium text-node-verify"
                  : "flex items-center gap-1 text-[11px] font-medium text-amber-500"
              }
            >
              {angle.grounded ? "🛡️ Faits vérifiés (sourcés)" : "🛡️ Ancrage incomplet — à vérifier"}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2.5 border-t border-border pt-2.5">
            {angle.sources.length > 0 ? (
              <ul className="space-y-1">
                {angle.sources.map((src, i) => (
                  <li key={i}>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{src}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] italic text-amber-500">
                ⚠ Aucune source — angle à vérifier avant publication.
              </p>
            )}

            {onPlan && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPlan({ network, text: draft })}
                className="w-full gap-1.5"
              >
                <CalendarClock className="h-4 w-4" /> Planifier ce post
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
