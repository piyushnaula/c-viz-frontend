import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './Tour.css';

export function useTour() {
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            steps: [
                {
                    element: '.code-editor-container',
                    popover: {
                        title: '📝 Code Editor',
                        description: 'Write or paste your C code here. The Monaco editor provides syntax highlighting and auto-completion.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '.visualize-btn',
                    popover: {
                        title: '▶️ Visualize Button',
                        description: 'Click this to parse your code and generate the AST visualization.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.ast-panel',
                    popover: {
                        title: '🌳 AST Visualization',
                        description: 'This panel shows the Abstract Syntax Tree. Drag to pan, scroll to zoom. Click nodes to see details.',
                        side: 'left',
                        align: 'start'
                    }
                },
                {
                    element: '.cfg-toggle-btn',
                    popover: {
                        title: '📊 Control Flow Graph',
                        description: 'Toggle the CFG view to see how your program flows through conditionals and loops.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.preprocess-toggle-btn',
                    popover: {
                        title: '⚡ Preprocessor View',
                        description: 'See how macros and includes are expanded before compilation.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.optimization-btn',
                    popover: {
                        title: '🔧 Optimization Lab',
                        description: 'Compare unoptimized (-O0) vs optimized (-O3) LLVM IR. See real compiler optimizations!',
                        side: 'bottom'
                    }
                },
                {
                    element: '.stack-btn',
                    popover: {
                        title: '📚 Stack Visualizer',
                        description: 'Visualize recursive function calls with an animated stack simulation.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.examples-btn',
                    popover: {
                        title: '📋 Examples',
                        description: 'Load pre-made code examples to explore different C constructs.',
                        side: 'bottom'
                    }
                },
                {
                    popover: {
                        title: '🎉 Ready to Explore!',
                        description: 'You\'re all set! Try writing some C code and click Visualize to get started.'
                    }
                }
            ]
        });

        driverObj.drive();
    };

    return { startTour };
}

export default function Tour({ onClose }) {
    const { startTour } = useTour();

    useEffect(() => {
        startTour();
        if (onClose) onClose();
    }, []);

    return null;
}
