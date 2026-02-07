import { useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,


    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import CFGNode from './CFGNode';
import { cfgToReactFlow } from '../utils/cfgConverter';
import { useAST } from '../context/ASTContext';
import './CFGVisualizer.css';

// Register custom node types
const nodeTypes = {
    cfgNode: CFGNode
};

function CFGVisualizerInner() {
    const { cfgData, isLoading } = useAST();

    // Convert CFG to React Flow format
    const { initialNodes, initialEdges } = useMemo(() => {
        if (!cfgData) return { initialNodes: [], initialEdges: [] };
        const { nodes, edges } = cfgToReactFlow(cfgData);
        return { initialNodes: nodes, initialEdges: edges };
    }, [cfgData]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Update when CFG changes
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    if (isLoading) {
        return (
            <div className="cfg-placeholder">
                <div className="loading-spinner"></div>
                <p>Building CFG...</p>
            </div>
        );
    }

    if (!cfgData || nodes.length === 0) {
        return (
            <div className="cfg-placeholder">
                <div className="placeholder-icon">📊</div>
                <p>Click "Visualize" to generate Control Flow Graph</p>
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
            fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            onlyRenderVisibleElements={true}
        >
            <Background color="#333" gap={20} size={1} />


            <Panel position="top-left" className="cfg-stats">
                <span>{nodes.length} blocks</span>
                <span>{edges.length} edges</span>
            </Panel>
        </ReactFlow>
    );
}

function CFGVisualizer() {
    return (
        <ReactFlowProvider>
            <CFGVisualizerInner />
        </ReactFlowProvider>
    );
}

export default CFGVisualizer;
