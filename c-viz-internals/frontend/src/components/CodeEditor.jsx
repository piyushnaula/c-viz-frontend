import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader, RotateCcw, FileCode, ChevronDown, FileJson, FlaskConical, Layers } from 'lucide-react';
import { useAST } from '../context/ASTContext';
import { CODE_EXAMPLES } from '../utils/codeExamples';
import './CodeEditor.css';

function CodeEditor({ onShowStack }) {
    const { sourceCode, setSourceCode, parseCode, resetCode, loadExample, isLoading, preprocessCode, optimizeCode } = useAST();
    const [showExamples, setShowExamples] = useState(false);

    const editorOptions = useMemo(() => ({
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        padding: { top: 16 }
    }), []);

    const handleEditorChange = (value, event) => {
        try {
            if (value !== undefined) {
                setSourceCode(value);
            }
        } catch (err) {
            // Suppress the 'Canceled' error from Monaco which happens on rapid typing
            if (err?.message !== 'Canceled') {
                console.error("Editor change error:", err);
            }
        }
    };

    // Add lifecycle error handler for the editor
    const handleEditorDidMount = (editor, monaco) => {
        // Optional: verify editor is ready
    };

    const handleVisualize = () => {
        parseCode();
    };

    const handleLoadExample = (example) => {
        loadExample(example.code);
        setShowExamples(false);
    };

    const handleEditorWillMount = (monaco) => {
        monaco.editor.defineTheme('c-viz-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0d0d0dff',
            },
        });
    };

    return (
        <div className="code-editor-container">
            <div className="editor-header">
                <h2>C Source Code</h2>
                <div className="editor-actions">
                    <button
                        className="action-btn secondary"
                        onClick={resetCode}
                        title="Reset to default"
                    >
                        <RotateCcw size={16} />
                    </button>

                    <div className="dropdown-container">
                        <button
                            className="action-btn secondary examples-btn"
                            onClick={() => setShowExamples(!showExamples)}
                            title="Load example"
                        >
                            <FileCode size={16} />
                            <ChevronDown size={14} />
                        </button>

                        {showExamples && (
                            <div className="dropdown-menu">
                                {CODE_EXAMPLES.map((example, idx) => (
                                    <button
                                        key={idx}
                                        className="dropdown-item"
                                        onClick={() => handleLoadExample(example)}
                                    >
                                        {example.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        className="action-btn secondary preprocess-toggle-btn"
                        onClick={() => preprocessCode()}
                        title="Show Preprocessed Code"
                    >
                        <FileJson size={16} />
                    </button>

                    <button
                        className="action-btn secondary optimization-btn"
                        onClick={() => optimizeCode()}
                        title="Optimization Lab"
                    >
                        <FlaskConical size={16} />
                    </button>

                    <button
                        className="action-btn secondary stack-btn"
                        onClick={onShowStack}
                        title="Stack Frame Visualizer"
                    >
                        <Layers size={16} />
                    </button>

                    <button
                        className="visualize-btn"
                        onClick={handleVisualize}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader className="btn-icon spinning" size={18} />
                                Parsing...
                            </>
                        ) : (
                            <>
                                <Play className="btn-icon" size={18} />
                                Visualize
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="editor-wrapper">
                <Editor
                    height="100%"
                    defaultLanguage="c"
                    theme="c-viz-dark"
                    value={sourceCode}
                    onChange={handleEditorChange}
                    beforeMount={handleEditorWillMount}
                    options={editorOptions}
                />
            </div>
        </div>
    );
}

export default CodeEditor;
