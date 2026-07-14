"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Sparkles, Link2, CheckCircle2 } from "lucide-react";
import { NodeShell } from "./NodeShell";
import type { GraphNode } from "../types";

/** Leaf node (rose): one finished LinkedIn angle. */
function AngleNodeImpl({ data }: NodeProps<GraphNode>) {
  const event = data.event;
  if (event.type !== "angle") return null;
  const { angle, index } = event.payload;

  return (
    <NodeShell
      icon={Sparkles}
      accent="node-angle"
      title={angle.revised ? `Angle ${index + 1} · révisé ✦` : `Angle ${index + 1}`}
      subtitle={`${angle.points.length} points · ${angle.sources.length} source${angle.sources.length > 1 ? "s" : ""}`}
      status={data.status}
      hasSource={false}
    >
      <p className="line-clamp-3 text-[11px] font-medium leading-snug">{angle.hook}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {angle.sources.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-node-angle">
            <Link2 className="h-3 w-3" />
            source réelle
          </span>
        )}
        {angle.review && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {angle.review.score}/100
          </span>
        )}
      </div>
    </NodeShell>
  );
}

export const AngleNode = memo(AngleNodeImpl);
