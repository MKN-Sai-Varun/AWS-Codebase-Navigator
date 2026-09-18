// Converts backend graph data (nodes/edges keyed by file path) into
// React Flow's node/edge shape with a simple grid layout. This is
// intentionally simple for the MVP — no dependency-aware layout engine.

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 110;
const COLUMNS = 4;

export function toReactFlowGraph(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];

  const rfNodes = nodes.map((node, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    return {
      id: node.id,
      position: { x: column * COLUMN_WIDTH, y: row * ROW_HEIGHT },
      data: { label: node.label || node.id },
      type: "default"
    };
  });

  const rfEdges = edges.map((edge, index) => ({
    id: `edge-${index}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    label: edge.relation,
    animated: false
  }));

  return { nodes: rfNodes, edges: rfEdges };
}