"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { X, Brain, Linkedin, Globe, Sparkles, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CompanyBrainSchema,
  EnrichResponseSchema,
  type CompanyBrain,
} from "@/mastra/lib/schemas";

/**
 * COMPANY BRAIN — the "it knows you" popup.
 *
 * The user drops a LinkedIn URL, a company URL and a short description, then can
 * "Récupérer mes infos" (Bright Data enrichment → an editable author profile),
 * and saves. The saved brain is injected into every run so posts are written in
 * the user's voice.
 */
export function CompanyBrainDialog({
  open,
  onOpenChange,
  brain,
  onSave,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brain: CompanyBrain;
  onSave: (next: CompanyBrain) => void;
  onClear: () => void;
}) {
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [companyUrl, setCompanyUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [profile, setProfile] = React.useState("");
  const [enriching, setEnriching] = React.useState(false);

  // Seed the fields from the saved brain each time the dialog opens.
  React.useEffect(() => {
    if (open) {
      setLinkedinUrl(brain.linkedinUrl ?? "");
      setCompanyUrl(brain.companyUrl ?? "");
      setDescription(brain.description ?? "");
      setProfile(brain.profile ?? "");
    }
  }, [open, brain]);

  const hasSignal =
    linkedinUrl.trim() !== "" || companyUrl.trim() !== "" || description.trim() !== "";

  const enrich = async () => {
    if (!hasSignal) {
      toast.error("Ajoute une URL LinkedIn, une URL d'entreprise ou une description d'abord.");
      return;
    }
    setEnriching(true);
    try {
      const res = await fetch("/api/company-brain/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl, companyUrl, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Échec de l'enrichissement.");
      const parsed = EnrichResponseSchema.safeParse(data);
      if (!parsed.success) throw new Error("Réponse d'enrichissement invalide.");

      setProfile(parsed.data.profile);
      if (parsed.data.source === "bright-data" && parsed.data.sources.length > 0) {
        toast.success(`Profil enrichi depuis ${parsed.data.sources.length} source(s) web réelle(s).`);
      } else if (parsed.data.profile) {
        toast.success("Profil généré. Ajoute une clé Bright Data pour l'enrichir depuis le web réel.");
      } else {
        toast.message("Pas assez d'infos pour enrichir — complète la description.");
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Erreur réseau pendant l'enrichissement.");
    } finally {
      setEnriching(false);
    }
  };

  const save = () => {
    const next: CompanyBrain = CompanyBrainSchema.parse({
      linkedinUrl: linkedinUrl.trim(),
      companyUrl: companyUrl.trim(),
      description: description.trim(),
      profile: profile.trim(),
    });
    onSave(next);
    toast.success("Company Brain enregistré — vos posts seront écrits dans votre voix.");
    onOpenChange(false);
  };

  const reset = () => {
    setLinkedinUrl("");
    setCompanyUrl("");
    setDescription("");
    setProfile("");
    onClear();
    toast.message("Company Brain effacé.");
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-2xl border border-border bg-card shadow-elevation-3",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))]">
              <Brain className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold">Company Brain</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                Apprenez à l&apos;agent qui vous êtes. Il écrira chaque post dans votre voix.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Body (scrollable) */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <Field label="URL LinkedIn" icon={<Linkedin className="h-4 w-4" />}>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/votre-profil"
                inputMode="url"
                autoComplete="off"
              />
            </Field>

            <Field label="URL entreprise" icon={<Globe className="h-4 w-4" />}>
              <Input
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://votre-entreprise.com"
                inputMode="url"
                autoComplete="off"
              />
            </Field>

            <Field label="Descriptif concis" icon={<Sparkles className="h-4 w-4" />}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qui êtes-vous, ce que vous faites, votre secteur, votre ton…"
                rows={3}
                maxLength={2000}
                className="flex w-full resize-y rounded-md border border-input bg-background/60 px-3 py-2 text-sm leading-relaxed ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </Field>

            {/* Enrich */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-background/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Laissez BrandPilot lire vos liens et bâtir votre profil auteur.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={enrich}
                disabled={enriching || !hasSignal}
                className="shrink-0"
              >
                {enriching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyse…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Récupérer mes infos
                  </>
                )}
              </Button>
            </div>

            <Field
              label="Profil auteur"
              icon={<Brain className="h-4 w-4" />}
              hint="Généré automatiquement — modifiable à la main."
            >
              <textarea
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="Le profil apparaîtra ici après « Récupérer mes infos » — ou écrivez-le vous-même."
                rows={6}
                maxLength={4000}
                className="flex w-full resize-y rounded-md border border-input bg-background/60 px-3 py-2 text-sm leading-relaxed ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-border px-5 py-3">
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
              <Trash2 className="h-4 w-4" /> Effacer
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button type="button" variant="gradient" size="sm" onClick={save}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
        {hint && <span className="font-normal text-muted-foreground">· {hint}</span>}
      </div>
      {children}
    </div>
  );
}
