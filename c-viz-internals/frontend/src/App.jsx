import { Toaster } from 'sonner';
import CodeEditor from './components/CodeEditor';
import ASTViewer from './components/ASTViewer';
import AnalysisConsole from './components/AnalysisConsole';
import PreprocessorView from './components/PreprocessorView';
import OptimizationView from './components/OptimizationView';
import StackVisualizer from './components/StackVisualizer';
import Navbar from './components/Navbar';
import { useTour } from './components/Tour';
import { ASTProvider, useAST } from './context/ASTContext';
import { useState } from 'react';
import './App.css';

function AppContent() {
  const { sourceCode, preprocessedCode, setPreprocessedCode, optimizationData, setOptimizationData } = useAST();
  const [showStackVisualizer, setShowStackVisualizer] = useState(false);

  return (
    <div className="app-container">
      <Navbar />

      <div className="main-content">
        <div className="panel editor-panel">
          <CodeEditor onShowStack={() => setShowStackVisualizer(true)} />
        </div>
        <div className="panel viewer-panel">
          <ASTViewer />
        </div>
      </div>

      <div className="console-panel">
        <AnalysisConsole />
      </div>

      {preprocessedCode && (
        <PreprocessorView
          originalCode={sourceCode}
          preprocessedCode={preprocessedCode}
          onClose={() => setPreprocessedCode(null)}
        />
      )}

      {optimizationData && (
        <OptimizationView
          o0Code={optimizationData.o0}
          o3Code={optimizationData.o3}
          onClose={() => setOptimizationData(null)}
        />
      )}

      {showStackVisualizer && (
        <StackVisualizer onClose={() => setShowStackVisualizer(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <ASTProvider>
      <AppContent />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e1e',
            color: '#e4e4e4',
            border: '1px solid #333'
          }
        }}
      />
    </ASTProvider>
  );
}

export default App;
