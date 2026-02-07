import React, { useRef, useMemo, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import './PreprocessorView.css';

class EditorErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
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

function PreprocessorView({ originalCode, preprocessedCode, onClose }) {
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(preprocessedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 50);
    };

    const options = useMemo(() => ({
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        readOnly: true,
        minimap: { enabled: false },
        renderSideBySide: window.innerWidth > 768, // Inline on mobile
        scrollBeyondLastLine: false,
        automaticLayout: true
    }), []);

    const showEditor = !isClosing && originalCode && preprocessedCode;

    return (
        <div className="preprocessor-overlay">
            <div className="preprocessor-modal">
                <div className="preprocessor-header">
                    <h3>Preprocessor Expansion View</h3>
                    <div className="preprocessor-actions">
                        <button className="copy-btn" onClick={handleCopy} title="Copy Preprocessed Code">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied' : 'Copy'}
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
                                key={`${originalCode.length}-${preprocessedCode.length}`}
                                height="100%"
                                original={originalCode}
                                modified={preprocessedCode}
                                language="c"
                                theme="vs-dark"
                                options={options}
                            />
                        ) : (
                            <div className="editor-loading">
                                {isClosing ? 'Closing...' : 'Loading preprocessor data...'}
                            </div>
                        )}
                    </EditorErrorBoundary>
                </div>

                <div className="preprocessor-footer">
                    <div className="legend">
                        <span className="legend-item original">Original Code</span>
                        <span className="legend-item preprocessed">Preprocessed (Expanded)</span>
                    </div>
                    <p className="hint">Shows the result of <code>clang -E -P</code> (macros expanded, comments removed)</p>
                </div>
            </div>
        </div>
    );
}

export default PreprocessorView;
