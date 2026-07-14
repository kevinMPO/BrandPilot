"use client";

import { motion } from "framer-motion";
import { Workflow } from "lucide-react";
import type { RunStatus } from "@/hooks/useAgentStream";

/**
 * Overlay shown when the canvas has no nodes:
 *  • running -> skeleton placeholders (the agent is booting / first thought)
 *  • idle    -> illustrated empty state inviting the first run
 */
export function EmptyCanvas({ status }: { status: RunStatus }) {
  if (status === "running") {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        <div className="flex items-center gap-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-24 w-52 rounded-card border border-border bg-card/70"
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <EmptyIllustration />
        <h2 className="mt-6 flex items-center gap-2 text-lg font-semibold">
          <Workflow className="h-5 w-5 text-primary" />
          Le raisonnement de l&apos;agent s&apos;affichera ici
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Saisis un sujet en haut, puis lance l&apos;agent. Chaque étape de sa
          boucle ReAct — réflexion, recherche web, observation, puis les 3 angles
          — apparaîtra en direct, nœud après nœud.
        </p>
      </div>
    </div>
  );
}

/** Inline SVG so there's zero asset dependency. */
function EmptyIllustration() {
  return (
    <svg width="220" height="120" viewBox="0 0 220 120" fill="none" className="opacity-90">
      <defs>
        <linearGradient id="empty-grad" x1="0" y1="0" x2="220" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--gradient-from))" />
          <stop offset="0.5" stopColor="hsl(var(--gradient-via))" />
          <stop offset="1" stopColor="hsl(var(--gradient-to))" />
        </linearGradient>
      </defs>
      <path
        d="M40 60 H88 M132 36 H180 M132 84 H180"
        stroke="url(#empty-grad)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      <path d="M88 60 C108 60 112 36 132 36" stroke="url(#empty-grad)" strokeWidth="2.5" fill="none" />
      <path d="M88 60 C108 60 112 84 132 84" stroke="url(#empty-grad)" strokeWidth="2.5" fill="none" />
      <rect x="8" y="46" width="32" height="28" rx="8" fill="hsl(var(--node-reasoning))" opacity="0.9" />
      <rect x="180" y="22" width="32" height="28" rx="8" fill="hsl(var(--node-angle))" opacity="0.9" />
      <rect x="180" y="70" width="32" height="28" rx="8" fill="hsl(var(--node-angle))" opacity="0.9" />
      <circle cx="110" cy="60" r="9" fill="hsl(var(--node-action))" />
    </svg>
  );
}
