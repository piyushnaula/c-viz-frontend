import { useAST } from '../context/ASTContext';
import { AlertCircle, AlertTriangle, GitBranch, Network } from 'lucide-react';
import AstVisualizer from './AstVisualizer';
import CFGVisualizer from './CFGVisualizer';
import './ASTViewer.css';

function ASTViewer() {
    const { error, viewMode, setViewMode } = useAST();

    return (
        <div className="ast-viewer-container ast-panel">
            <div className="viewer-header">
                <h2>
                    {viewMode === 'ast' ? 'AST Visualization' : 'Control Flow Graph'}
                </h2>

                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'ast' ? 'active' : ''}`}
                        onClick={() => setViewMode('ast')}
                        title="Abstract Syntax Tree"
                    >
                        <Network size={16} />
                        AST
                    </button>
                    <button
                        className={`toggle-btn cfg-toggle-btn ${viewMode === 'cfg' ? 'active' : ''}`}
                        onClick={() => setViewMode('cfg')}
                        title="Control Flow Graph"
                    >
                        <GitBranch size={16} />
                        CFG
                    </button>
                </div>
            </div>

            {error && (
                <div className={`error-banner ${error.type}`}>
                    {error.type === 'error' ? (
                        <AlertCircle size={16} />
                    ) : (
                        <AlertTriangle size={16} />
                    )}
                    <span>
                        {error.messages.map((err, idx) => (
                            <span key={idx}>
                                {err.line ? `Line ${err.line}: ` : ''}{err.message}
                                {idx < error.messages.length - 1 ? ' | ' : ''}
                            </span>
                        ))}
                    </span>
                </div>
            )}

            <div className="viewer-content">
                {viewMode === 'ast' ? <AstVisualizer /> : <CFGVisualizer />}
            </div>
        </div>
    );
}

export default ASTViewer;
