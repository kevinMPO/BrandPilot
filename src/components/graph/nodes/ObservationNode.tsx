"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Database, Timer } from "lucide-react";
import { NodeShell } from "./NodeShell";
import type { GraphNode } from "../types";

/** "Tool returned data" node (grey). Shows result count, latency, sources. */
function ObservationNodeImpl({ data }: NodeProps<GraphNode>) {
  const event = data.event;
  const results = event.type === "observation" ? event.payload.results : [];
  const latency = event.type === "observation" ? event.payload.latencyMs : 0;
  const src = results[0]?.source;

  return (
    <NodeShell
      icon={Database}
      accent="node-observation"
      title={`${results.length} résultat${results.length > 1 ? "s" : ""}`}
      subtitle={src === "mock" ? "données simulées" : "Bright Data (réel)"}
      status={data.status}
    >
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Timer className="h-3 w-3" /> {latency} ms
        </span>
        {results[0] && (
          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {results[0].title}
          </p>
        )}
      </div>
    </NodeShell>
  );
}

export const ObservationNode = memo(ObservationNodeImpl);
