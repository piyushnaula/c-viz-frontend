import { useState, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Layers, Settings } from 'lucide-react';
import { useAST } from '../context/ASTContext';
import { simulateRecursion, getRecursiveInfo } from '../utils/stackSimulator';
import './StackVisualizer.css';

function StackVisualizer({ onClose }) {
    const { astData } = useAST();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(800);
    const [maxDepth, setMaxDepth] = useState(5);

    // Get info about recursive function
    const recursiveInfo = useMemo(() => {
        return getRecursiveInfo(astData);
    }, [astData]);

    // Generate stack simulation steps from AST
    const steps = useMemo(() => {
        if (!astData) return [];
        const depth = maxDepth === '' ? 1 : Math.min(20, Math.max(1, maxDepth));
        return simulateRecursion(astData, depth);
    }, [astData, maxDepth]);

    // Get current stack state
    const currentState = useMemo(() => {
        if (steps.length === 0) return { stack: [], action: null, fullStack: [] };
        return steps[Math.min(currentStep, steps.length - 1)];
    }, [steps, currentStep]);

    // Auto-play functionality
    useEffect(() => {
        if (!isPlaying || currentStep >= steps.length - 1) {
            setIsPlaying(false);
            return;
        }

        const timer = setTimeout(() => {
            setCurrentStep(prev => prev + 1);
        }, playSpeed);

        return () => clearTimeout(timer);
    }, [isPlaying, currentStep, steps.length, playSpeed]);

    // Reset when maxDepth changes
    useEffect(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, [maxDepth]);

    const handleStepForward = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleStepBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleReset = () => {
        setCurrentStep(0);
        setIsPlaying(false);
    };

    const handlePlayPause = () => {
        if (currentStep >= steps.length - 1) {
            setCurrentStep(0);
        }
        setIsPlaying(!isPlaying);
    };



    if (!astData) {
        return (
            <div className="stack-visualizer-overlay">
                <div className="stack-visualizer-modal">
                    <div className="stack-header">
                        <h3>Stack Frame Visualizer</h3>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="stack-empty">
                        <Layers size={48} />
                        <p>Visualize code first to see stack frames</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!recursiveInfo) {
        return (
            <div className="stack-visualizer-overlay">
                <div className="stack-visualizer-modal">
                    <div className="stack-header">
                        <h3>Stack Frame Visualizer</h3>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="stack-empty">
                        <Layers size={48} />
                        <p>No recursive function detected in your code.</p>
                        <p className="hint">Try writing a function that calls itself, like factorial or fibonacci!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="stack-visualizer-overlay">
            <div className="stack-visualizer-modal">
                <div className="stack-header">
                    <div className="header-info">
                        <h3>Stack Frame Visualizer</h3>
                        <span className="step-counter">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Function info bar */}
                <div className="function-info-bar">
                    <span className="func-label">Recursive Function:</span>
                    <code className="func-name">{recursiveInfo.name}({recursiveInfo.params.join(', ')})</code>
                    <div className="depth-control">
                        <label>Start value:</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={maxDepth}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    setMaxDepth('');
                                } else {
                                    const num = parseInt(val);
                                    if (!isNaN(num)) setMaxDepth(num);
                                }
                            }}
                            onBlur={() => {
                                let val = parseInt(maxDepth);
                                if (isNaN(val) || val < 1) val = 1;
                                if (val > 20) val = 20;
                                setMaxDepth(val);
                            }}
                        />
                    </div>
                </div>

                <div className="stack-content">
                    {/* Stack visualization */}
                    <div className="stack-container">
                        <div className="stack-label">CALL STACK</div>
                        <div className="stack-frames">
                            {currentState.fullStack?.length > 0 ? (
                                currentState.fullStack.map((frame, index) => (
                                    <div
                                        key={`${frame.name}-${frame.argValue}-${index}`}
                                        className={`stack-frame ${index === currentState.fullStack.length - 1 ? 'active' : ''} ${currentState.action === 'push' && index === currentState.fullStack.length - 1 ? 'pushing' : ''}`}
                                        style={{
                                            animationDelay: `${index * 0.05}s`,
                                            zIndex: currentState.fullStack.length - index
                                        }}
                                    >
                                        <div className="frame-depth">{index}</div>
                                        <div className="frame-info">
                                            <div className="frame-call">
                                                <span className="func">{frame.name}</span>
                                                <span className="args">({frame.argValue !== undefined ? frame.argValue : ''})</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-stack">
                                    <span>Stack is empty</span>
                                </div>
                            )}
                        </div>
                        {currentState.fullStack?.length > 0 && (
                            <div className="stack-base">
                                <span>STACK BASE</span>
                            </div>
                        )}
                    </div>

                    {/* Info panel */}
                    <div className="info-panel">
                        <div className="action-indicator">
                            {currentState.action === 'push' && (
                                <div className="action push">
                                    <span className="action-icon">↓</span>
                                    <span className="action-text">PUSH</span>
                                    <code>{currentState.description}</code>
                                </div>
                            )}
                            {currentState.action === 'pop' && (
                                <div className="action pop">
                                    <span className="action-icon">↑</span>
                                    <span className="action-text">POP</span>
                                    <code>{currentState.frame?.name}({currentState.frame?.argValue})</code>
                                    <div className="return-value">
                                        <span className="return-label">returns</span>
                                        <span className="return-num">{currentState.returnValue}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="stack-stats">
                            <div className="stat">
                                <span className="stat-label">Current Depth</span>
                                <span className="stat-value">{currentState.fullStack?.length || 0}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Input Value</span>
                                <span className="stat-value">{maxDepth}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="stack-controls">
                    <button
                        className="control-btn"
                        onClick={handleReset}
                        title="Reset"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        className="control-btn"
                        onClick={handleStepBack}
                        disabled={currentStep === 0}
                        title="Step Back"
                    >
                        <SkipBack size={18} />
                    </button>
                    <button
                        className="control-btn play-btn"
                        onClick={handlePlayPause}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                        className="control-btn"
                        onClick={handleStepForward}
                        disabled={currentStep >= steps.length - 1}
                        title="Step Forward"
                    >
                        <SkipForward size={18} />
                    </button>

                    <div className="speed-control">
                        <span className="speed-label">Speed:</span>
                        <div className="speed-options">
                            {[
                                { label: '0.5x', value: 1500 },
                                { label: '1x', value: 800 },
                                { label: '2x', value: 400 },
                                { label: '4x', value: 200 }
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    className={`speed-btn ${playSpeed === option.value ? 'active' : ''}`}
                                    onClick={() => setPlaySpeed(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default StackVisualizer;
