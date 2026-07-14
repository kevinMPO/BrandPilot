import type { ReactNode } from "react";
import Link from "next/link";
import {
  Plane, ArrowRight, Brain, Activity, ShieldCheck, Lightbulb, Sparkles, Clock, Search,
} from "lucide-react";

/**
 * HOME — the landing page. Elevator pitch for BrandPilot (the AI agent that
 * knows you), with two entry points: Home (here) and Connexion (the agent, /app).
 */
export const metadata = {
  title: "BrandPilot — votre copilote de contenu LinkedIn",
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 78% -5%, hsl(var(--gradient-via) / 0.16), transparent 60%), radial-gradient(50% 45% at 10% 5%, hsl(var(--gradient-to) / 0.12), transparent 55%)",
        }}
      />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2" aria-label="BrandPilot, accueil">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))]">
              <Plane className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">BrandPilot</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Home
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-md bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))] px-3.5 py-1.5 text-sm font-semibold text-white shadow-elevation-2 transition-[filter] hover:brightness-110"
            >
              Connexion <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <header className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Copilote IA · Contenu LinkedIn
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Vous avez les idées.{" "}
            <span className="bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))] bg-clip-text text-transparent">
              BrandPilot les fait décoller.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
            Beaucoup ont des idées, peu osent publier — faute de temps ou d&apos;inspiration.
            BrandPilot est l&apos;agent IA qui <strong className="text-foreground">vous connaît</strong>,
            cherche le web en direct, et vous livre <strong className="text-foreground">3 angles
            sourcés</strong>, écrits dans <strong className="text-foreground">votre voix</strong>.
            Vous choisissez, vous publiez.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))] px-5 py-3 text-sm font-semibold text-white shadow-elevation-3 transition-[filter] hover:brightness-110"
            >
              Lancer l&apos;agent <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Lightbulb className="h-4 w-4 text-primary" /> Voir l&apos;Inspiration
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <Chip icon={<ShieldCheck className="h-3.5 w-3.5" />}>Sources réelles</Chip>
            <Chip icon={<Brain className="h-3.5 w-3.5" />}>Votre voix, pas un template</Chip>
            <Chip icon={<Activity className="h-3.5 w-3.5" />}>Raisonnement en direct</Chip>
          </div>
        </div>
      </header>

      {/* ── Value props ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Brain className="h-5 w-5" />}
            title="Il vous connaît"
            body="Le Company Brain apprend qui vous êtes — profil LinkedIn, site, ton, garde-fous (ex : pas de tutoiement). Chaque post sonne comme vous."
          />
          <Feature
            icon={<Activity className="h-5 w-5" />}
            title="Il réfléchit devant vous"
            body="Pas de boîte noire : l'agent raisonne, cherche le web réel et recoupe ses sources — en direct, sur un graphe animé."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="3 angles prêts à publier"
            body="Data-driven, contre-intuitif, retour d'expérience. Chacun sourcé et vérifié. Vous éditez si besoin, vous copiez, vous publiez."
          />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Trois étapes. Zéro page blanche.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <Step n="01" icon={<Brain className="h-4 w-4" />} title="Il apprend qui vous êtes" body="Renseignez votre Company Brain une fois : votre voix, votre secteur, vos règles." />
          <Step n="02" icon={<Search className="h-4 w-4" />} title="Il cherche et raisonne" body="L'agent lance de vraies recherches web et construit ses angles, étape par étape." />
          <Step n="03" icon={<Clock className="h-4 w-4" />} title="Vous publiez en minutes" body="3 angles sourcés, éditables, prêts à coller sur LinkedIn." />
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-6">
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-elevation-3 sm:p-14">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Votre prochaine idée mérite d&apos;être lue.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Laissez le copilote s&apos;occuper du temps et de l&apos;inspiration. Gardez le meilleur :
            votre expertise, en haut du fil.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))] px-6 py-3 text-sm font-semibold text-white shadow-elevation-3 transition-[filter] hover:brightness-110"
          >
            Connexion — accéder à l&apos;agent <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Plane className="h-4 w-4 text-primary" /> BrandPilot
          </span>
          <span>Votre copilote de contenu LinkedIn</span>
          <span className="ml-auto">© 2026</span>
        </div>
      </footer>
    </div>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: ReactNode; title: string; body: string }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-primary">{n}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
