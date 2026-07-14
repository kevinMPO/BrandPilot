import type { Node, Edge } from "@xyflow/react";
import type { AgentEvent, NodeStatus } from "@/mastra/lib/schemas";

/** What every graph node carries. `event` is the full typed event behind it. */
export interface GraphNodeData extends Record<string, unknown> {
  kind: "memory_recall" | "reasoning" | "action" | "observation" | "angle" | "verification";
  label: string;
  status: NodeStatus;
  event: AgentEvent;
}

/** Edge data: whether it closes a loop, and whether it's currently "live". */
export interface GraphEdgeData extends Record<string, unknown> {
  loop?: boolean;
  active?: boolean;
}

export type GraphNode = Node<GraphNodeData>;
export type GraphEdge = Edge<GraphEdgeData>;
