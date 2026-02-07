import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { getNodeColor, formatNodeType } from '../utils/astConverter';
import './ASTNode.css';

/**
 * Custom React Flow node component for AST nodes
 */
function ASTNode({ data }) {
    const { type, name, line } = data;
    const bgColor = getNodeColor(type);
    const displayType = formatNodeType(type);

    return (
        <div
            className="ast-node"
            style={{
                borderColor: bgColor,
                boxShadow: `0 0 10px ${bgColor}40`
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="ast-node-handle"
            />

            <div className="ast-node-type" style={{ backgroundColor: bgColor }}>
                {displayType}
            </div>

            {name && (
                <div className="ast-node-name">
                    {name}
                </div>
            )}

            {line > 0 && (
                <div className="ast-node-line">
                    Line {line}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="ast-node-handle"
            />
        </div>
    );
}

export default memo(ASTNode);
