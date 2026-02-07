import { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,


    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import ASTNode from './ASTNode';
import { astToReactFlow, getNodeColor } from '../utils/astConverter';
import { useAST } from '../context/ASTContext';
import './AstVisualizer.css';

// Register custom node types - memoized outside component
const nodeTypes = {
    astNode: ASTNode
};

// Default edge options - memoized outside component
const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: false
};

function AstVisualizerInner() {
    const { astData, isLoading, error } = useAST();

    // Convert AST to React Flow format
    const { initialNodes, initialEdges } = useMemo(() => {
        if (!astData) return { initialNodes: [], initialEdges: [] };
        const { nodes, edges } = astToReactFlow(astData);
        return { initialNodes: nodes, initialEdges: edges };
    }, [astData]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Update nodes when AST changes
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // Custom minimap node color
    const nodeColor = useCallback((node) => {
        return getNodeColor(node.data?.type || '');
    }, []);

    if (isLoading) {
        return (
            <div className="visualizer-placeholder">
                <div className="loading-spinner"></div>
                <p>Parsing code...</p>
            </div>
        );
    }

    if (!astData && !error) {
        return (
            <div className="visualizer-placeholder">
                <div className="placeholder-icon">🌳</div>
                <p>Click "Visualize" to see the AST tree</p>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="visualizer-placeholder">
                <p>No AST nodes to display</p>
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.05}
            maxZoom={2}
            defaultEdgeOptions={defaultEdgeOptions}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            // Performance optimizations
            onlyRenderVisibleElements={true}
            deleteKeyCode={null}
        >
            <Background color="#333" gap={20} size={1} />


            <Panel position="top-left" className="stats-panel">
                <span>{nodes.length} nodes</span>
                <span>{edges.length} edges</span>
            </Panel>
        </ReactFlow>
    );
}

// Wrap with provider for React Flow to work
function AstVisualizer() {
    return (
        <ReactFlowProvider>
            <AstVisualizerInner />
        </ReactFlowProvider>
    );
}

export default AstVisualizer;
