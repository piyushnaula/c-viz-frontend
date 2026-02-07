import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CFGNode.css';

function CFGNode({ data }) {
    const { label, statements, isEntry, isExit } = data;

    return (
        <div className={`cfg-node ${isEntry ? 'entry' : ''} ${isExit ? 'exit' : ''}`}>
            <Handle type="target" position={Position.Top} className="cfg-handle" />

            <div className="cfg-node-header">
                <span className="cfg-label">{label}</span>
            </div>

            {statements && statements.length > 0 && (
                <div className="cfg-statements">
                    {statements.map((stmt, idx) => (
                        <div key={idx} className="cfg-statement">
                            <span className="stmt-text">{stmt.text}</span>
                            <span className="stmt-line">L{stmt.line}</span>
                        </div>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="cfg-handle" />
        </div>
    );
}

export default memo(CFGNode);
