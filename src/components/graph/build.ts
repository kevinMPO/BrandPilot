import type { AgentEvent } from "@/mastra/lib/schemas";
import type { RunStatus } from "@/hooks/useAgentStream";
import type { GraphNode, GraphEdge } from "./types";

/**
 * Pure transform: the ordered list of agent events -> React Flow nodes + edges.
 *
 * Topology comes straight from each event's `sourceNodeId` (the backend already
 * decided who links to whom, including loop-backs). Lifecycle status is derived
 * here: the most recent node pulses while the run is active; on error the last
 * node turns red.
 */
export function buildGraph(
  events: AgentEvent[],
  status: RunStatus,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Maps keep INSERTION ORDER while letting later events UPSERT earlier nodes.
  // This is what makes streaming work: many reasoning events share one id and
  // just refresh the node's text; same for an angle re-emitted with its score.
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  const hasError = events.some((e) => e.type === "error");

  for (const event of events) {
    if (
      event.type !== "memory_recall" &&
      event.type !== "reasoning" &&
      event.type !== "action" &&
      event.type !== "observation" &&
      event.type !== "angle" &&
      event.type !== "verification"
    ) {
      continue; // final / error / phase are not nodes
    }

    const existing = nodeMap.get(event.id);
    if (existing) {
      // Upsert: refresh content, keep position/order.
      existing.data = { ...existing.data, label: event.label, event };
    } else {
      nodeMap.set(event.id, {
        id: event.id,
        type: event.type,
        position: { x: 0, y: 0 }, // dagre fills this in
        data: { kind: event.type, label: event.label, status: "done", event },
      });
    }

    if (event.sourceNodeId && nodeMap.has(event.sourceNodeId)) {
      const loop = event.type === "reasoning" && Boolean(event.loop);
      const edgeId = `e-${event.sourceNodeId}-${event.id}`;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: event.sourceNodeId,
          target: event.id,
          type: "gradient",
          data: { loop, active: false },
        });
      }
    }
  }

  const nodes = [...nodeMap.values()];
  const edges = [...edgeMap.values()];

  // ── Lifecycle: light up the latest node ────────────────────────────────
  const last = nodes[nodes.length - 1];
  if (last) {
    if (hasError) {
      last.data.status = "error";
    } else if (status === "running") {
      last.data.status = "running";
      // Animate the edge feeding the active node.
      for (const edge of edges) {
        if (edge.target === last.id) edge.data = { ...edge.data, active: true };
      }
    }
  }

  // Keep loop edges visually animated regardless.
  for (const edge of edges) {
    if (edge.data?.loop) edge.data.active = true;
  }

  return { nodes, edges };
}
