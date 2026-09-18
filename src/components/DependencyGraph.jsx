import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toReactFlowGraph } from "../utils/graph.js";
import EmptyState from "./EmptyState.jsx";
import { Share2 } from "lucide-react";

export default function DependencyGraph({ graph, onNodeSelect }) {
  const { nodes, edges } = useMemo(() => toReactFlowGraph(graph), [graph]);

  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={Share2}
        title="No graph data yet."
        description="This repository's dependency graph will appear here once analysis includes it."
      />
    );
  }

  return (
    <div className="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={(_, node) => onNodeSelect?.(node.id)}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#24304a" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable style={{ background: "#101826" }} />
      </ReactFlow>
    </div>
  );
}