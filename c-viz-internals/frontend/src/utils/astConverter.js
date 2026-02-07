import dagre from 'dagre';

/**
 * Convert recursive AST JSON to React Flow nodes and edges.
 * Uses dagre for hierarchical layout calculation.
 */

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

/**
 * Recursively traverse AST and generate nodes/edges
 */
function traverseAST(node, nodes, edges, parentId = null) {
    if (!node) return;

    // Create node
    const flowNode = {
        id: node.id,
        type: 'astNode',
        data: {
            type: node.type,
            name: node.name,
            line: node.line,
            column: node.column
        },
        position: { x: 0, y: 0 } // Will be calculated by dagre
    };
    nodes.push(flowNode);

    // Create edge from parent
    if (parentId) {
        edges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#00d9ff', strokeWidth: 2 }
        });
    }

    // Process children
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            traverseAST(child, nodes, edges, node.id);
        });
    }
}

/**
 * Apply dagre layout to position nodes hierarchically
 */
function applyDagreLayout(nodes, edges) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: 'TB',  // Top to bottom
        nodesep: 50,    // Horizontal spacing
        ranksep: 80,    // Vertical spacing
        marginx: 20,
        marginy: 20
    });

    // Add nodes to dagre graph
    nodes.forEach(node => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    // Add edges to dagre graph
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply calculated positions to nodes
    const layoutedNodes = nodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2
            }
        };
    });

    return layoutedNodes;
}

/**
 * Main function: Convert AST to React Flow format
 */
export function astToReactFlow(ast) {
    if (!ast) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];

    traverseAST(ast, nodes, edges);
    const layoutedNodes = applyDagreLayout(nodes, edges);

    return { nodes: layoutedNodes, edges };
}

/**
 * Get color based on node type
 */
export function getNodeColor(type) {
    const colorMap = {
        'TRANSLATION_UNIT': '#6366f1',      // Indigo
        'FUNCTION_DECL': '#10b981',         // Emerald
        'VAR_DECL': '#f59e0b',              // Amber
        'PARM_DECL': '#f97316',             // Orange
        'COMPOUND_STMT': '#8b5cf6',         // Violet
        'RETURN_STMT': '#ec4899',           // Pink
        'IF_STMT': '#14b8a6',               // Teal
        'FOR_STMT': '#06b6d4',              // Cyan
        'WHILE_STMT': '#0ea5e9',            // Sky
        'CALL_EXPR': '#22c55e',             // Green
        'BINARY_OPERATOR': '#eab308',       // Yellow
        'UNARY_OPERATOR': '#f472b6',        // Pink
        'DECL_REF_EXPR': '#a855f7',         // Purple
        'INTEGER_LITERAL': '#64748b',       // Slate
        'STRING_LITERAL': '#fb923c',        // Orange
        'UNEXPOSED_EXPR': '#94a3b8',        // Slate light
    };

    return colorMap[type] || '#64748b';
}

/**
 * Format node type for display (remove underscores, title case)
 */
export function formatNodeType(type) {
    return type
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}
