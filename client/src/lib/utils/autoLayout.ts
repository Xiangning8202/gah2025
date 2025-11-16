import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function autoLayoutGraph(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'TB',
    nodeWidth = 250,
    nodeHeight = 100,
    rankSep = 100,
    nodeSep = 80,
  } = options;

  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Set graph properties
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(dagreGraph);

  // Apply the calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

export function cloneNode(node: Node, offset: { x: number; y: number } = { x: 50, y: 50 }): Node {
  const newId = `${node.id}_clone_${Date.now()}`;
  
  return {
    ...node,
    id: newId,
    position: {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    },
    data: {
      ...node.data,
      label: `${node.data?.label || node.id} (Clone)`,
    },
  };
}

