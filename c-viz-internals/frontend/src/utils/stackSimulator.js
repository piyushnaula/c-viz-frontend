/**
 * Stack Frame Simulation Engine
 * Fixed: Only search FIRST child of CALL_EXPR for function name.
 */

/**
 * Extract function definitions from AST.
 */
function extractFunctions(ast) {
    const functions = {};

    function traverse(node) {
        if (!node) return;

        if (node.type === 'FUNCTION_DECL' && node.name) {
            const params = [];
            for (const child of node.children || []) {
                if (child.type === 'PARM_DECL' && child.name) {
                    params.push(child.name);
                }
            }

            functions[node.name] = {
                name: node.name,
                line: node.line,
                params: params,
                body: node,
                isRecursive: false
            };
        }

        for (const child of node.children || []) {
            traverse(child);
        }
    }

    traverse(ast);
    return functions;
}

/**
 * Find function name from the FIRST child of CALL_EXPR only.
 * The first child represents the callee, other children are arguments.
 */
function findCalleeFromFirstChild(callExprNode) {
    if (!callExprNode?.children?.length) return null;

    // Get only the first child - that's where the function reference is
    const firstChild = callExprNode.children[0];

    // Search only in this first child subtree
    function searchForName(node) {
        if (!node) return null;

        // DECL_REF_EXPR usually contains the function name
        if (node.type === 'DECL_REF_EXPR' && node.name) {
            return node.name;
        }

        // Check if the node itself has the name
        if (node.name && node.name.trim()) {
            return node.name;
        }

        // Recurse into children
        for (const child of node.children || []) {
            const found = searchForName(child);
            if (found) return found;
        }

        return null;
    }

    return searchForName(firstChild);
}

/**
 * Find all function calls in a node.
 */
function findAllCalls(node, funcNames) {
    const calls = [];
    const seen = new Set();

    function traverse(n) {
        if (!n) return;

        if (n.type === 'CALL_EXPR') {
            // Get callee from first child only
            const calleeName = findCalleeFromFirstChild(n);

            console.log('[Stack] CALL_EXPR line', n.line, '-> callee:', calleeName || '(not found)');

            if (calleeName && funcNames.includes(calleeName)) {
                const key = `${calleeName}-${n.line}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    calls.push({ name: calleeName, line: n.line });
                }
            }
        }

        for (const child of n.children || []) {
            traverse(child);
        }
    }

    traverse(node);
    return calls;
}

/**
 * Detect recursive functions.
 */
function detectRecursiveFunctions(functions) {
    const funcNames = Object.keys(functions);

    for (const funcName of funcNames) {
        const func = functions[funcName];
        const calls = findAllCalls(func.body, funcNames);

        console.log('[Stack]', funcName, 'calls:', calls.map(c => c.name).join(', ') || 'none');

        func.isRecursive = calls.some(c => c.name === funcName);
        func.calls = calls;

        if (func.isRecursive) {
            console.log('[Stack] ✓ RECURSIVE:', funcName);
        }
    }

    return functions;
}

/**
 * Calculate return value.
 */
function calculateReturn(funcName, value) {
    const lower = funcName.toLowerCase();
    if (lower.includes('fib')) {
        if (value <= 1) return value;
        let a = 0, b = 1;
        for (let i = 2; i <= value; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
    if (lower.includes('factorial') || lower.includes('fact')) {
        let result = 1;
        for (let i = 2; i <= value; i++) {
            result *= i;
        }
        return result;
    }
    return value;
}

/**
 * Detect the step size and operator from the recursive call argument.
 * e.g. factorial(n - 1) -> op: '-', value: 1
 * e.g. func(n - 2) -> op: '-', value: 2
 * e.g. func(n / 2) -> op: '/', value: 2
 */
function detectRecursiveStep(callNode, paramName) {
    if (!callNode || !callNode.children || callNode.children.length < 2) return null;

    // First arg is usually at index 1 (index 0 is the function ref)
    const argNode = callNode.children[1];

    if (argNode.type === 'BINARY_OPERATOR') {
        const operator = extractOperator(argNode);
        const operand = extractOperand(argNode);

        if (operator && operand !== null) {
            return { operator, value: operand };
        }
    }

    return { operator: '-', value: 1 }; // Default fallback
}

function extractOperator(node) {
    // This is a simplification. The backend doesn't always give us the exact operator string in the type.
    // But usually BINARY_OPERATOR nodes in Clang AST don't explicitly say "MINUS" in the JSON usually,
    // we might need to infer or look at name if available.
    // However, for this visualizer, we might just look at the children structure.
    // A usually robust way for simple CST/AST:
    // If it's n - 1, we assume logic based on standard recursion patterns.

    // Actually, looking at previous backend AST dumps, BINARY_OPERATOR doesn't easily give the op.
    // But we can try to guess based on context or just default to -1 if unsure.
    // Let's rely on a basic heuristic for now or defaults.
    return '-'; // Most common
}

function extractOperand(node) {
    // Find an integer literal in children
    for (const child of node.children || []) {
        if (child.type === 'INTEGER_LITERAL') {
            // The name often contains the value '1', '2' etc. as string
            // or we might need to look at tokens.
            // In our converter, 'name' often holds the textual representation for literals
            if (child.name && !isNaN(parseInt(child.name))) {
                return parseInt(child.name);
            }
        }
    }
    return 1; // Default
}

/**
 * Simulate recursion.
 */
export function simulateRecursion(ast, maxDepth = 5) {
    if (!ast) return [];

    const functions = extractFunctions(ast);
    detectRecursiveFunctions(functions);

    let recursiveFunc = null;
    let stepInfo = { operator: '-', value: 1 };

    for (const funcName in functions) {
        if (functions[funcName].isRecursive) {
            recursiveFunc = funcName;
            // Analyze the first recursive call we found to guess the step
            const firstCall = functions[funcName].calls.find(c => c.name === funcName);
            // We need to find the AST node for this call to analyze args.
            // Using a helper to find node by line might be needed, or we just pass node in calls list.
            // For now, let's just stick to -1 default or try to improve if we had node ref.
            // To do this properly, findAllCalls should return the NODE, not just name/line.
            break;
        }
    }

    // RE-FIND call node to detect step (improvement)
    if (recursiveFunc) {
        const funcBody = functions[recursiveFunc].body;
        const findCallNode = (node) => {
            if (node.type === 'CALL_EXPR') {
                const callee = findCalleeFromFirstChild(node);
                if (callee === recursiveFunc) return node;
            }
            for (const child of node.children || []) {
                const found = findCallNode(child);
                if (found) return found;
            }
            return null;
        };
        const callNode = findCallNode(funcBody);
        if (callNode) {
            const detected = detectRecursiveStep(callNode);
            if (detected) stepInfo = detected;
        }
    }

    const trace = [];

    function simulateCall(funcName, argValue, depth, stack) {
        if (depth > maxDepth) return;
        // Safety break for infinite or very deep recursion
        if (stack.length > 20) return;

        const func = functions[funcName];
        if (!func) return;

        const paramName = func.params[0] || 'n';
        const returnValue = calculateReturn(funcName, argValue);

        const newFrame = {
            name: funcName,
            line: func.line,
            depth,
            argName: paramName,
            argValue: argValue,
            returnValue: returnValue
        };

        const newStack = [...stack, newFrame];

        trace.push({
            action: 'push',
            frame: { ...newFrame },
            stack: newStack.map(f => f.name),
            fullStack: newStack.map(f => ({ ...f })),
            description: `${funcName}(${argValue})`
        });

        // Base case detection: heuristic
        // If argValue hits 0 or 1, we treat matches as base case usually
        const isBaseCase = argValue <= 1;

        if (func.isRecursive && !isBaseCase) {
            let nextVal = argValue;
            if (stepInfo.operator === '-') nextVal -= stepInfo.value;
            else if (stepInfo.operator === '+') nextVal += stepInfo.value;
            else if (stepInfo.operator === '/') nextVal = Math.floor(nextVal / stepInfo.value);
            else if (stepInfo.operator === '*') nextVal *= stepInfo.value;

            // Safety check to prevent infinite loop simulation if step is 0 or wrong direction
            if (nextVal >= argValue && stepInfo.operator !== '+') {
                // Fallback to n-1 if we can't strictly decrease
                nextVal = argValue - 1;
            }

            simulateCall(funcName, nextVal, depth + 1, newStack);
        }

        trace.push({
            action: 'pop',
            frame: { ...newFrame, isBaseCase },
            stack: stack.map(f => f.name),
            fullStack: stack.map(f => ({ ...f })),
            description: `return from ${funcName}(${argValue})`,
            returnValue: returnValue
        });
    }

    if (recursiveFunc) {
        console.log('[Stack] ✓ Simulating:', recursiveFunc, 'Step:', stepInfo);
        // Ensure starting argValue is number
        let initialVal = parseInt(maxDepth);
        if (isNaN(initialVal)) initialVal = 5;

        simulateCall(recursiveFunc, initialVal, 0, []);
    } else {
        console.log('[Stack] No recursive function found');
        if (functions['main']) {
            trace.push({
                action: 'push',
                frame: { name: 'main', line: functions['main'].line, depth: 0, argValue: '' },
                stack: ['main'],
                fullStack: [{ name: 'main', line: functions['main'].line, depth: 0 }],
                description: 'main()'
            });
            trace.push({
                action: 'pop',
                frame: { name: 'main', line: functions['main'].line, depth: 0 },
                stack: [],
                fullStack: [],
                description: 'return 0',
                returnValue: 0
            });
        }
    }

    return trace;
}

/**
 * Get recursive function info.
 */
export function getRecursiveInfo(ast) {
    if (!ast) return null;

    const functions = extractFunctions(ast);
    detectRecursiveFunctions(functions);

    for (const funcName in functions) {
        if (functions[funcName].isRecursive) {
            return {
                name: funcName,
                params: functions[funcName].params,
                line: functions[funcName].line
            };
        }
    }

    return null;
}
