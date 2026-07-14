"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeStatus } from "@/mastra/lib/schemas";

export type NodeAccent =
  | "node-reasoning"
  | "node-action"
  | "node-observation"
  | "node-angle"
  | "node-verify"
  | "node-memory";

/**
 * Tailwind can't generate classes from `bg-${accent}` template strings (the
 * scanner only sees complete literals), so every accent's classes are written
 * out in full here.
 */
const ACCENT: Record<
  NodeAccent,
  { halo: string; border: string; iconBg: string; iconText: string; dot: string }
> = {
  "node-reasoning": {
    halo: "bg-node-reasoning",
    border: "border-node-reasoning/40",
    iconBg: "bg-node-reasoning/15",
    iconText: "text-node-reasoning",
    dot: "bg-node-reasoning",
  },
  "node-action": {
    halo: "bg-node-action",
    border: "border-node-action/40",
    iconBg: "bg-node-action/15",
    iconText: "text-node-action",
    dot: "bg-node-action",
  },
  "node-observation": {
    halo: "bg-node-observation",
    border: "border-node-observation/40",
    iconBg: "bg-node-observation/15",
    iconText: "text-node-observation",
    dot: "bg-node-observation",
  },
  "node-angle": {
    halo: "bg-node-angle",
    border: "border-node-angle/40",
    iconBg: "bg-node-angle/15",
    iconText: "text-node-angle",
    dot: "bg-node-angle",
  },
  "node-verify": {
    halo: "bg-node-verify",
    border: "border-node-verify/40",
    iconBg: "bg-node-verify/15",
    iconText: "text-node-verify",
    dot: "bg-node-verify",
  },
  "node-memory": {
    halo: "bg-node-memory",
    border: "border-node-memory/40",
    iconBg: "bg-node-memory/15",
    iconText: "text-node-memory",
    dot: "bg-node-memory",
  },
};

/**
 * Shared visual shell for every agent node: rounded card, colored icon on the
 * left, title + status subtitle, optional body. Handles the three lifecycle
 * states — `running` shows a pulsing halo (Framer Motion), `error` goes red.
 */
export function NodeShell({
  icon: Icon,
  accent,
  title,
  subtitle,
  status,
  children,
  hasSource = true,
  hasTarget = true,
  className,
}: {
  icon: LucideIcon;
  /** Tailwind color token for this node kind. */
  accent: NodeAccent;
  title: string;
  subtitle: string;
  status: NodeStatus;
  children?: React.ReactNode;
  hasSource?: boolean;
  hasTarget?: boolean;
  className?: string;
}) {
  const running = status === "running";
  const error = status === "error";
  const c = ACCENT[accent];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="relative w-full"
    >
      {/* Pulsing halo while the node is the active step. */}
      {running && (
        <span
          aria-hidden
          className={cn(
            "absolute -inset-1 rounded-[1.1rem] blur-md animate-halo-pulse",
            c.halo,
          )}
        />
      )}

      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-0 !bg-border"
        />
      )}

      <div
        className={cn(
          // `text-card-foreground` is REQUIRED: React Flow applies a default
          // node text color that would otherwise make uncolored text (titles,
          // the angle hook) invisible on the dark card.
          "relative w-full rounded-card border bg-card text-card-foreground p-3 shadow-elevation-2 backdrop-blur",
          error ? "border-destructive" : c.border,
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              error ? "bg-destructive/15 text-destructive" : cn(c.iconBg, c.iconText),
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-card-foreground">{title}</p>
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1 text-[11px] font-medium",
                error ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {running && (
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full animate-pulse", c.dot)} />
              )}
              {subtitle}
            </p>
          </div>
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>

      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-0 !bg-border"
        />
      )}
    </motion.div>
  );
}
