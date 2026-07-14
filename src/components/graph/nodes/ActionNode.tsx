"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";
import { NodeShell } from "./NodeShell";
import type { GraphNode } from "../types";

/** "Calling a tool" node (blue). Shows the search query. */
function ActionNodeImpl({ data }: NodeProps<GraphNode>) {
  const event = data.event;
  const query = event.type === "action" ? event.payload.query : "";
  const tool = event.type === "action" ? event.payload.tool : "";

  return (
    <NodeShell
      icon={Globe}
      accent="node-action"
      title="Recherche web"
      subtitle={
        data.status === "running" ? "appel de l'outil…" : tool || "Bright Data"
      }
      status={data.status}
    >
      <p className="truncate rounded-md bg-secondary/60 px-2 py-1 font-mono text-[10px] text-foreground/80">
        “{query}”
      </p>
    </NodeShell>
  );
}

export const ActionNode = memo(ActionNodeImpl);
