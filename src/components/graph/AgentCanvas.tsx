"use client";

import * as React from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from "@xyflow/react";
import { AnimatePresence } from "framer-motion";
import "@xyflow/react/dist/style.css";

import { ReasoningNode } from "./nodes/ReasoningNode";
import { ActionNode } from "./nodes/ActionNode";
import { ObservationNode } from "./nodes/ObservationNode";
import { AngleNode } from "./nodes/AngleNode";
import { VerificationNode } from "./nodes/VerificationNode";
import { MemoryNode } from "./nodes/MemoryNode";
import { GradientEdge } from "./edges/GradientEdge";
import { buildGraph } from "./build";
import { layoutGraph } from "./layout";
import { EmptyCanvas } from "./EmptyCanvas";
import { NodeDetail } from "./NodeDetail";
import type { GraphNode, GraphEdge } from "./types";
import type { AgentEvent } from "@/mastra/lib/schemas";
import type { RunStatus } from "@/hooks/useAgentStream";

/**
 * IMPORTANT (React Flow perf): nodeTypes / edgeTypes MUST be defined once,
 * OUTSIDE the component, or React Flow re-registers them every render and warns.
 */
const nodeTypes = {
  memory_recall: MemoryNode,
  reasoning: ReasoningNode,
  action: ActionNode,
  observation: ObservationNode,
  angle: AngleNode,
  verification: VerificationNode,
};
const edgeTypes = { gradient: GradientEdge };

interface AgentCanvasProps {
  events: AgentEvent[];
  status: RunStatus;
  /** When set, the canvas pans/zooms to focus that node (timeline click). */
  focusNodeId?: string | null;
}

function Canvas({ events, status, focusNodeId }: AgentCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);
  const { fitView } = useReactFlow();

  // Rebuild + re-layout the whole graph whenever the event list changes.
  const built = React.useMemo(() => buildGraph(events, status), [events, status]);
  const nodeCount = built.nodes.length;

  React.useEffect(() => {
    const laidOut = layoutGraph(built.nodes, built.edges);
    setNodes(
      laidOut.nodes.map((n) => ({ ...n, selected: n.id === focusNodeId })),
    );
    setEdges(laidOut.edges);
  }, [built, focusNodeId, setNodes, setEdges]);

  // Auto-fit as the graph grows.
  React.useEffect(() => {
    if (nodeCount === 0) return;
    const t = setTimeout(() => void fitView({ padding: 0.22, duration: 450 }), 60);
    return () => clearTimeout(t);
  }, [nodeCount, fitView]);

  // Focus a specific node when asked (and not actively running, to avoid fighting auto-fit).
  React.useEffect(() => {
    if (!focusNodeId) return;
    const t = setTimeout(
      () => void fitView({ nodes: [{ id: focusNodeId }], padding: 0.6, duration: 450, maxZoom: 1.4 }),
      40,
    );
    return () => clearTimeout(t);
  }, [focusNodeId, fitView]);

  const [detail, setDetail] = React.useState<AgentEvent | null>(null);
  const onNodeClick = React.useCallback<NodeMouseHandler>((_e, node) => {
    setDetail((node as GraphNode).data.event);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={() => setDetail(null)}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      minZoom={0.25}
      maxZoom={1.75}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      {/* Shared gradient definition referenced by every edge stroke. */}
      <svg className="absolute h-0 w-0">
        <defs>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--gradient-from))" />
            <stop offset="50%" stopColor="hsl(var(--gradient-via))" />
            <stop offset="100%" stopColor="hsl(var(--gradient-to))" />
          </linearGradient>
        </defs>
      </svg>

      <Background variant={BackgroundVariant.Dots} gap={22} size={1} className="opacity-60" />
      <Controls showInteractive={false} className="!shadow-elevation-2" />
      <MiniMap
        pannable
        zoomable
        className="!bg-card !border !border-border !rounded-lg"
        maskColor="hsl(var(--background) / 0.6)"
        nodeColor={(n) => miniMapColor(n.type)}
      />

      {nodeCount === 0 && <EmptyCanvas status={status} />}

      <AnimatePresence>
        {detail && <NodeDetail event={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </ReactFlow>
  );
}

function miniMapColor(type?: string): string {
  switch (type) {
    case "memory_recall":
      return "hsl(38 92% 55%)";
    case "reasoning":
      return "hsl(270 90% 66%)";
    case "action":
      return "hsl(214 90% 60%)";
    case "observation":
      return "hsl(240 5% 55%)";
    case "angle":
      return "hsl(322 82% 62%)";
    case "verification":
      return "hsl(172 66% 50%)";
    default:
      return "hsl(240 5% 40%)";
  }
}

/** Public component: provides the React Flow context. */
export default function AgentCanvas(props: AgentCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
