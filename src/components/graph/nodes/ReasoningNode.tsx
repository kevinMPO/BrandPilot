"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Brain } from "lucide-react";
import { NodeShell } from "./NodeShell";
import type { GraphNode } from "../types";

/** "The model is thinking" node (violet). Shows the reasoning text. */
function ReasoningNodeImpl({ data }: NodeProps<GraphNode>) {
  const event = data.event;
  const text = event.type === "reasoning" ? event.payload.text : "";
  const step = event.type === "reasoning" ? event.payload.step : undefined;
  const isLoop = event.type === "reasoning" && event.loop;
  const streaming = event.type === "reasoning" && Boolean(event.payload.streaming);
  // While typing, show the most recent words (the tail) so the caret stays visible.
  const display = streaming && text.length > 170 ? `…${text.slice(-160)}` : text;

  return (
    <NodeShell
      icon={Brain}
      accent="node-reasoning"
      title={isLoop ? "Raisonnement · re-recherche ↺" : "Raisonnement"}
      subtitle={
        streaming
          ? "il réfléchit…"
          : step
            ? `étape ${step}`
            : "réflexion"
      }
      status={data.status}
      hasTarget={Boolean(event.sourceNodeId)}
    >
      <p className="line-clamp-4 text-[11px] leading-snug text-muted-foreground">
        {display}
        {/* Blinking caret while the thought is still being "typed". */}
        {streaming && (
          <span className="ml-0.5 inline-block h-3 w-[2px] -translate-y-[1px] animate-pulse bg-node-reasoning align-middle" />
        )}
      </p>
    </NodeShell>
  );
}

export const ReasoningNode = memo(ReasoningNodeImpl);
