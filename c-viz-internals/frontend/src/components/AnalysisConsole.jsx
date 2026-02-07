import { useState } from 'react';
import { useAST } from '../context/ASTContext';
import { AlertTriangle, AlertCircle, Table, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import './AnalysisConsole.css';

function AnalysisConsole() {
    const { symbolTable, diagnostics, isLoading } = useAST();
    const [activeTab, setActiveTab] = useState('diagnostics');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
    const errorCount = diagnostics.filter(d => d.severity === 'error').length;

    if (isCollapsed) {
        return (
            <div className="console-collapsed" onClick={() => setIsCollapsed(false)}>
                <div className="console-collapsed-content">
                    <Terminal size={16} />
                    <span>Analysis Console</span>
                    {diagnostics.length > 0 && (
                        <span className="badge-group">
                            {warningCount > 0 && <span className="badge warning">{warningCount} warnings</span>}
                            {errorCount > 0 && <span className="badge error">{errorCount} errors</span>}
                        </span>
                    )}
                    <ChevronUp size={16} />
                </div>
            </div>
        );
    }

    return (
        <div className="analysis-console">
            <div className="console-header">
                <div className="console-tabs">
                    <button
                        className={`tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('diagnostics')}
                    >
                        <AlertTriangle size={14} />
                        Diagnostics
                        {diagnostics.length > 0 && (
                            <span className="tab-badge">{diagnostics.length}</span>
                        )}
                    </button>
                    <button
                        className={`tab ${activeTab === 'symbols' ? 'active' : ''}`}
                        onClick={() => setActiveTab('symbols')}
                    >
                        <Table size={14} />
                        Symbol Table
                        {symbolTable.length > 0 && (
                            <span className="tab-badge">{symbolTable.length}</span>
                        )}
                    </button>
                </div>
                <button className="collapse-btn" onClick={() => setIsCollapsed(true)}>
                    <ChevronDown size={16} />
                </button>
            </div>

            <div className="console-content">
                {isLoading && (
                    <div className="console-placeholder">Analyzing...</div>
                )}

                {!isLoading && activeTab === 'diagnostics' && (
                    <div className="diagnostics-panel">
                        {diagnostics.length === 0 ? (
                            <div className="console-placeholder">
                                No issues detected. Click "Visualize" to analyze your code.
                            </div>
                        ) : (
                            <div className="diagnostics-list">
                                {diagnostics.map((diag, idx) => (
                                    <div key={idx} className={`diagnostic-item ${diag.severity}`}>
                                        {diag.severity === 'warning' ? (
                                            <AlertTriangle size={16} className="diag-icon" />
                                        ) : (
                                            <AlertCircle size={16} className="diag-icon" />
                                        )}
                                        <span className="diag-code">{diag.code}</span>
                                        <span className="diag-message">{diag.message}</span>
                                        <span className="diag-location">
                                            Line {diag.line} • {diag.scope}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && activeTab === 'symbols' && (
                    <div className="symbols-panel">
                        {symbolTable.length === 0 ? (
                            <div className="console-placeholder">
                                No symbols found. Click "Visualize" to analyze your code.
                            </div>
                        ) : (
                            <table className="symbol-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Kind</th>
                                        <th>Type</th>
                                        <th>Scope</th>
                                        <th>Line</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {symbolTable.map((symbol, idx) => (
                                        <tr key={idx}>
                                            <td className="symbol-name">{symbol.name}</td>
                                            <td>
                                                <span className={`kind-badge ${symbol.kind}`}>
                                                    {symbol.kind}
                                                </span>
                                            </td>
                                            <td className="symbol-type">{symbol.type}</td>
                                            <td className="symbol-scope">{symbol.scope}</td>
                                            <td className="symbol-line">{symbol.line}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnalysisConsole;
