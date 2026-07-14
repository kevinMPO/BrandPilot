"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Github, PanelRightOpen, Plane, Home } from "lucide-react";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useCompanyBrain } from "@/hooks/useCompanyBrain";
import { useInspirationStream } from "@/hooks/useInspirationStream";
import { usePlanner } from "@/hooks/usePlanner";
import { QueryBar } from "@/components/QueryBar";
import { ResultPanel } from "@/components/ResultPanel";
import { RunTimeline } from "@/components/RunTimeline";
import { CompanyBrainDialog } from "@/components/CompanyBrainDialog";
import { InspirationDialog } from "@/components/InspirationDialog";
import { PlannerDialog } from "@/components/PlannerDialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Angle, InspirationIdea, SocialNetwork } from "@/mastra/lib/schemas";

// React Flow is heavy and browser-only: load it dynamically, no SSR.
const AgentCanvas = dynamic(() => import("@/components/graph/AgentCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-card/40" />,
});

export default function AgentApp() {
  const { status, events, errorMessage, run, reset, abort } = useAgentStream();
  const { brain, save, clear, configured } = useCompanyBrain();
  const inspiration = useInspirationStream();
  const planner = usePlanner();

  const [topic, setTopic] = React.useState("");
  const [brainOpen, setBrainOpen] = React.useState(false);
  const [inspirationOpen, setInspirationOpen] = React.useState(false);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [lastNetwork, setLastNetwork] = React.useState<SocialNetwork>("linkedin");
  const [plannerOpen, setPlannerOpen] = React.useState(false);
  const [plannerDraft, setPlannerDraft] =
    React.useState<{ network: SocialNetwork; text: string } | null>(null);

  const angles = React.useMemo<Angle[]>(() => {
    const finalEvent = events.find((e) => e.type === "final");
    if (finalEvent?.type === "final") return finalEvent.payload.angles;
    return events
      .filter((e) => e.type === "angle")
      .map((e) => (e.type === "angle" ? e.payload.angle : null))
      .filter((a): a is Angle => a !== null);
  }, [events]);

  const prevStatus = React.useRef(status);
  React.useEffect(() => {
    if (prevStatus.current !== status) {
      if (status === "done") toast.success("Run terminé — 3 angles générés.");
      if (status === "error") toast.error(errorMessage ?? "Une erreur est survenue.");
      prevStatus.current = status;
    }
  }, [status, errorMessage]);

  const launch = React.useCallback(
    (network: SocialNetwork) => {
      if (topic.trim().length >= 3) {
        setLastNetwork(network);
        run(topic.trim(), brain, network);
      }
    },
    [topic, brain, run],
  );

  const openInspiration = React.useCallback(() => {
    setInspirationOpen(true);
    if (inspiration.status !== "running") inspiration.start(brain);
  }, [inspiration, brain]);

  const pickIdea = React.useCallback(
    (idea: InspirationIdea) => {
      setTopic(idea.title);
      setInspirationOpen(false);
      run(idea.title, brain, lastNetwork);
    },
    [run, brain, lastNetwork],
  );

  const openPlanner = React.useCallback(() => {
    setPlannerDraft(null);
    setPlannerOpen(true);
  }, []);

  const planPost = React.useCallback((input: { network: SocialNetwork; text: string }) => {
    setPlannerDraft(input);
    setPlannerOpen(true);
  }, []);

  const timeline = (
    <RunTimeline events={events} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Accueil BrandPilot">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(110deg,hsl(var(--gradient-from)),hsl(var(--gradient-via)),hsl(var(--gradient-to)))]">
            <Plane className="h-4 w-4 text-white" />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">BrandPilot</h1>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Votre copilote de contenu LinkedIn
            </p>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" aria-label="Retour à l'accueil">
              <Home className="h-4 w-4" /> Home
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild aria-label="Code source">
            <a href="https://github.com/kevinMPO/BrandPilot" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Query bar ──────────────────────────────────────────────────── */}
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <QueryBar
          topic={topic}
          setTopic={setTopic}
          status={status}
          onRun={launch}
          onStop={abort}
          onReset={reset}
          onOpenBrain={() => setBrainOpen(true)}
          brainConfigured={configured}
          onInspire={openInspiration}
          inspiring={inspiration.status === "running"}
          onOpenPlanner={openPlanner}
        />
      </div>

      {/* ── Main: canvas + timeline ────────────────────────────────────── */}
      <main className="flex min-h-0 flex-1">
        <section className="relative min-w-0 flex-1">
          <div className="absolute right-3 top-3 z-20 lg:hidden">
            <Sheet
              title="Déroulé"
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <PanelRightOpen className="h-4 w-4" /> Déroulé
                </Button>
              }
            >
              {timeline}
            </Sheet>
          </div>

          <AgentCanvas events={events} status={status} focusNodeId={selectedNodeId} />
        </section>

        <aside className="hidden w-80 shrink-0 border-l border-border lg:block">
          {timeline}
        </aside>
      </main>

      {/* ── Results: the 3 angles ──────────────────────────────────────── */}
      <AnimatePresence>
        {angles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="max-h-[46vh] overflow-y-auto border-t border-border bg-background/95 px-4 py-4 sm:px-6"
          >
            <ResultPanel angles={angles} network={lastNetwork} onPlan={planPost} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialogs ────────────────────────────────────────────────────── */}
      <CompanyBrainDialog
        open={brainOpen}
        onOpenChange={setBrainOpen}
        brain={brain}
        onSave={save}
        onClear={clear}
      />
      <InspirationDialog
        open={inspirationOpen}
        onOpenChange={setInspirationOpen}
        status={inspiration.status}
        reasoning={inspiration.reasoning}
        reasoningStreaming={inspiration.reasoningStreaming}
        searches={inspiration.searches}
        sources={inspiration.sources}
        ideas={inspiration.ideas}
        errorMessage={inspiration.errorMessage}
        brainConfigured={configured}
        onSelect={pickIdea}
        onRetry={() => inspiration.start(brain)}
        onOpenBrain={() => {
          setInspirationOpen(false);
          setBrainOpen(true);
        }}
      />
      <PlannerDialog
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        draft={plannerDraft}
        items={planner.items}
        onAdd={planner.add}
        onRemove={planner.remove}
        onDraftScheduled={() => setPlannerDraft(null)}
      />
    </div>
  );
}
