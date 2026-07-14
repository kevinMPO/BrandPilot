import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import type { GraphNode, GraphEdge } from "./types";

/**
 * Auto-layout the graph left-to-right with dagre.
 *
 * React Flow doesn't position nodes for you; dagre computes a clean DAG layout
 * (ranks = ReAct rounds) which we re-run every time a node is added so the
 * graph stays tidy as it grows live. Loop edges are excluded from ranking so
 * they don't fight the left-to-right flow (they just curve back visually).
 */
// Sizes must be GENEROUS (≥ the real rendered card) or siblings overlap.
// The width is also FORCED onto each node (style.width) so what dagre spaces
// for is exactly what the browser draws — no estimate/render mismatch.
const NODE_SIZE: Record<GraphNode["data"]["kind"], { w: number; h: number }> = {
  memory_recall: { w: 250, h: 108 },
  reasoning: { w: 270, h: 148 },
  action: { w: 250, h: 104 },
  observation: { w: 256, h: 124 },
  angle: { w: 290, h: 184 },
  verification: { w: 240, h: 104 },
};

export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // rankdir LR = flows left→right; ranksep = horizontal gap between columns,
  // nodesep = vertical gap between siblings (the "branches" of the tree).
  g.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 140, marginx: 32, marginy: 32, ranker: "tight-tree" });

  for (const node of nodes) {
    const size = NODE_SIZE[node.data.kind];
    g.setNode(node.id, { width: size.w, height: size.h });
  }
  for (const edge of edges) {
    // Loop-back edges are layout-neutral so they don't distort the ranks.
    if (edge.data?.loop) continue;
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const laidOut = nodes.map((node) => {
    const pos = g.node(node.id);
    const size = NODE_SIZE[node.data.kind];
    return {
      ...node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      // Force the rendered width to match the width dagre laid out for.
      style: { ...node.style, width: size.w },
      // dagre gives center coords; React Flow wants top-left.
      position: { x: pos.x - size.w / 2, y: pos.y - size.h / 2 },
    };
  });

  return { nodes: laidOut, edges };
}
