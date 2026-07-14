"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { GraphEdge } from "../types";

/**
 * Custom bézier edge.
 *  • normal edges: thick gradient (violet→rose→blue), animated dash when the
 *    run is active (flux qui circule).
 *  • loop edges (re-search): amber dashed curve with a "↺" label so the loop
 *    is unmistakable — this is the central visual payoff.
 */
function GradientEdgeImpl({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<GraphEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  const loop = Boolean(data?.loop);
  const active = Boolean(data?.active);

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: loop ? "hsl(38 92% 55%)" : "url(#edge-gradient)",
          strokeWidth: 2.5,
          strokeDasharray: loop ? "6 5" : active ? "8 8" : undefined,
          // Animated dash on active/loop edges (keyframes in tailwind config).
          animation: active || loop ? "dash-flow 0.6s linear infinite" : undefined,
          opacity: active || loop ? 1 : 0.55,
        }}
      />
      {loop && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="pointer-events-none absolute rounded-full border border-amber-500/50 bg-card px-1.5 py-0.5 text-[10px] font-semibold text-amber-500 shadow-elevation-1"
          >
            ↺ re-recherche
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const GradientEdge = memo(GradientEdgeImpl);
