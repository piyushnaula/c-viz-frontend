import React, { useRef, useMemo, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import './OptimizationView.css';

class EditorErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Suppress the specific Monaco disposal error to prevent white screen
        if (error?.message?.includes('TextModel got disposed')) {
            console.warn('Suppressed Monaco disposal error:', error);
        } else {
            console.error('Editor Error:', error, errorInfo);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.children !== prevProps.children) {
            this.state = { hasError: false };
        }
    }

    render() {
        if (this.state.hasError) {
            return <div className="editor-error">Editor reloading...</div>;
        }
        return this.props.children;
    }
}

function OptimizationView({ o0Code, o3Code, onClose }) {
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleCopy = () => {
        // Copy optimized code
        navigator.clipboard.writeText(o3Code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setIsClosing(true);
        // Small delay to allow component to render null/cleanup before unmounting
        setTimeout(onClose, 50);
    };

    const options = useMemo(() => ({
        fontSize: 13,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        readOnly: true,
        minimap: { enabled: false },
        renderSideBySide: window.innerWidth > 768, // Inline on mobile
        scrollBeyondLastLine: false,
        automaticLayout: true,
        diffWordWrap: 'off'
    }), []);

    // If closing, don't render the editor to allow cleaner disposal
    const showEditor = !isClosing && o0Code && o3Code;

    return (
        <div className="optimization-overlay">
            <div className="optimization-modal">
                <div className="optimization-header">
                    <div className="header-info">
                        <h3>Optimization Lab</h3>
                        <span className="subtitle-badge">LLVM IR Comparison</span>
                    </div>
                    <div className="optimization-actions">
                        <button className="copy-btn" onClick={handleCopy} title="Copy Optimized Code">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied O3' : 'Copy O3'}
                        </button>
                        <button className="close-btn" onClick={handleClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="diff-editor-container">
                    <EditorErrorBoundary>
                        {showEditor ? (
                            <DiffEditor
                                key={`${o0Code.length}-${o3Code.length}`}
                                height="100%"
                                original={o0Code}
                                modified={o3Code}
                                language="llvm"
                                theme="vs-dark"
                                options={options}
                            />
                        ) : (
                            <div className="editor-loading">
                                {isClosing ? 'Closing...' : 'Loading optimization data...'}
                            </div>
                        )}
                    </EditorErrorBoundary>
                </div>

                <div className="optimization-footer">
                    <div className="legend">
                        <div className="legend-group">
                            <span className="legend-dot o0"></span>
                            <div className="legend-text">
                                <strong>O0 (Unoptimized)</strong>
                                <p>Literal translation. Includes dead code and redundant operations.</p>
                            </div>
                        </div>
                        <div className="legend-group">
                            <span className="legend-dot o3"></span>
                            <div className="legend-text">
                                <strong>O3 (Max Optimization)</strong>
                                <p>Advanced optimizations: constant folding, dead code elimination, loop unrolling.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OptimizationView;
