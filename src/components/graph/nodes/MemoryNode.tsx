"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BrainCircuit } from "lucide-react";
import { NodeShell } from "./NodeShell";
import type { GraphNode } from "../types";

/** Upstream memory node (amber): themes already covered → non-repetition. */
function MemoryNodeImpl({ data }: NodeProps<GraphNode>) {
  const event = data.event;
  if (event.type !== "memory_recall") return null;
  const { themes } = event.payload;

  return (
    <NodeShell
      icon={BrainCircuit}
      accent="node-memory"
      title="Mémoire"
      subtitle={themes.length ? `${themes.length} thèmes déjà couverts` : "premier run"}
      status="done"
      hasTarget={false}
    >
      <p className="line-clamp-2 text-[10px] text-muted-foreground">
        {themes.length ? `Évite de répéter : ${themes.slice(0, 5).join(", ")}` : "Aucun run antérieur — table rase."}
      </p>
    </NodeShell>
  );
}

export const MemoryNode = memo(MemoryNodeImpl);
