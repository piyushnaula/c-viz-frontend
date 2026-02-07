/**
 * Convert CFG data to React Flow format with graph layout.
 */
import dagre from 'dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;

/**
 * Apply dagre layout to CFG nodes and edges.
 */
function getLayoutedElements(nodes, edges) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Use TB (top-bottom) direction for CFG
    dagreGraph.setGraph({
        rankdir: 'TB',
        nodesep: 80,
        ranksep: 100,
        marginx: 50,
        marginy: 50
    });

    // Add nodes
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    // Add edges
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply positions
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2
            }
        };
    });

    return { nodes: layoutedNodes, edges };
}

/**
 * Convert CFG data from backend to React Flow format.
 */
export function cfgToReactFlow(cfgData) {
    if (!cfgData || !cfgData.nodes) {
        return { nodes: [], edges: [] };
    }

    // Convert nodes
    const nodes = cfgData.nodes.map((block) => ({
        id: block.id,
        type: 'cfgNode',
        data: {
            label: block.label,
            statements: block.statements || [],
            isEntry: block.isEntry,
            isExit: block.isExit
        },
        position: { x: 0, y: 0 } // Will be set by layout
    }));

    // Convert edges with labels
    const edges = cfgData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: edge.label === 'loop back',
        label: edge.label || '',
        labelStyle: {
            fill: '#00d9ff',
            fontWeight: 500,
            fontSize: 11
        },
        labelBgStyle: {
            fill: 'rgba(26, 32, 44, 0.9)',
            fillOpacity: 0.9
        },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: {
            stroke: edge.label === 'loop back' ? '#f6ad55' : '#00d9ff',
            strokeWidth: 2
        },
        markerEnd: {
            type: 'arrowclosed',
            color: edge.label === 'loop back' ? '#f6ad55' : '#00d9ff'
        }
    }));

    // Apply layout
    return getLayoutedElements(nodes, edges);
}
