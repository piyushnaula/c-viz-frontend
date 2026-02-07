import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { DEFAULT_CODE } from '../utils/codeExamples';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create the context
const ASTContext = createContext(null);

// Provider component
export function ASTProvider({ children }) {
    const [sourceCode, setSourceCode] = useState(DEFAULT_CODE);
    const [astData, setAstData] = useState(null);
    const [cfgData, setCfgData] = useState(null);
    const [symbolTable, setSymbolTable] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('ast'); // 'ast' or 'cfg'

    const parseCode = useCallback(async () => {
        if (!sourceCode.trim()) {
            toast.error('Please enter some C code to parse');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch both AST and CFG in parallel
            const [astResponse, cfgResponse] = await Promise.all([
                axios.post(`${API_BASE_URL}/api/parse`, { code: sourceCode }),
                axios.post(`${API_BASE_URL}/api/cfg`, { code: sourceCode })
            ]);

            // Process AST response
            if (astResponse.data.success) {
                setAstData(astResponse.data.ast);
                setSymbolTable(astResponse.data.symbolTable || []);
                setDiagnostics(astResponse.data.diagnostics || []);

                const nodeCount = countNodes(astResponse.data.ast);
                const diagCount = astResponse.data.diagnostics?.length || 0;
                const parseErrors = astResponse.data.errors || [];

                // Separate header/include errors from syntax errors
                const headerErrors = parseErrors.filter(e =>
                    e.message?.includes('file not found') ||
                    e.message?.includes('not found')
                );
                const syntaxErrors = parseErrors.filter(e =>
                    !e.message?.includes('file not found') &&
                    !e.message?.includes('not found')
                );

                // Show appropriate error/warning
                if (syntaxErrors.length > 0) {
                    setError({ type: 'error', messages: syntaxErrors });
                    toast.error(`${syntaxErrors.length} syntax error(s) found`, {
                        description: syntaxErrors[0]?.message || 'Check the error banner'
                    });
                } else if (headerErrors.length > 0) {
                    setError({ type: 'warning', messages: headerErrors });
                    // Don't show toast for header warnings - just the banner
                } else if (diagCount > 0) {
                    setError(null);
                    toast.warning(`Parsed ${nodeCount} AST nodes with ${diagCount} diagnostic(s)`);
                } else {
                    setError(null);
                    toast.success(`Successfully parsed ${nodeCount} AST nodes`);
                }
            } else {
                setError({ type: 'error', messages: astResponse.data.errors });
                setAstData(null);
                setSymbolTable([]);
                setDiagnostics([]);
                toast.error('Failed to parse C code');
            }

            // Process CFG response
            if (cfgResponse.data.success) {
                setCfgData(cfgResponse.data.cfg);
                const cfgNodeCount = cfgResponse.data.cfg?.nodes?.length || 0;
                console.log(`CFG generated: ${cfgNodeCount} basic blocks`);
            } else {
                setCfgData(null);
            }

        } catch (err) {
            const errorMessage = err.message || 'Failed to connect to backend';
            setError({
                type: 'error',
                messages: [{ message: errorMessage }]
            });
            setAstData(null);
            setCfgData(null);
            setSymbolTable([]);
            setDiagnostics([]);
            toast.error('Backend Connection Error', { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [sourceCode]);

    const resetCode = useCallback(() => {
        setSourceCode(DEFAULT_CODE);
        setAstData(null);
        setCfgData(null);
        setSymbolTable([]);
        setDiagnostics([]);
        setError(null);
        toast.info('Editor reset to default');
    }, []);

    const loadExample = useCallback((code) => {
        setSourceCode(code);
        setAstData(null);
        setCfgData(null);
        setSymbolTable([]);
        setDiagnostics([]);
        setError(null);
        toast.info('Example loaded - click Visualize to parse');
    }, []);

    const [preprocessedCode, setPreprocessedCode] = useState(null);

    const preprocessCode = useCallback(async () => {
        if (!sourceCode.trim()) return;

        try {
            const response = await axios.post(`${API_BASE_URL}/api/preprocess`, { code: sourceCode });
            if (response.data.success) {
                setPreprocessedCode(response.data.preprocessed_code);
                toast.success('Code preprocessed successfully');
            } else {
                toast.error('Preprocessing failed', { description: response.data.error });
            }
        } catch (err) {
            toast.error('Preprocessing request failed', { description: err.message });
        }
    }, [sourceCode]);


    const [optimizationData, setOptimizationData] = useState(null);

    const optimizeCode = useCallback(async () => {
        if (!sourceCode.trim()) return;

        try {
            const response = await axios.post(`${API_BASE_URL}/api/optimize`, { code: sourceCode });
            if (response.data.success) {
                setOptimizationData(response.data);
                toast.success('Optimization analysis complete');
            } else {
                toast.error('Optimization analysis failed', { description: response.data.error });
            }
        } catch (err) {
            toast.error('Optimization request failed', { description: err.message });
        }
    }, [sourceCode]);

    const value = {
        sourceCode,
        setSourceCode,
        astData,
        cfgData,
        symbolTable,
        diagnostics,
        isLoading,
        error,
        viewMode,
        setViewMode,
        parseCode,
        resetCode,
        loadExample,
        preprocessCode,
        preprocessedCode,
        setPreprocessedCode,
        optimizeCode,
        optimizationData,
        setOptimizationData
    };

    return (
        <ASTContext.Provider value={value} >
            {children}
        </ASTContext.Provider >
    );
}

// Helper to count AST nodes
function countNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
        for (const child of node.children) {
            count += countNodes(child);
        }
    }
    return count;
}

// Custom hook
export function useAST() {
    const context = useContext(ASTContext);
    if (!context) {
        throw new Error('useAST must be used within an ASTProvider');
    }
    return context;
}
