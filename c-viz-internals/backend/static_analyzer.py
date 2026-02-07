"""
Static Analyzer for C code.
Extracts symbol table and performs basic static analysis checks.
"""

from clang.cindex import CursorKind


class StaticAnalyzer:
    """Performs static analysis on C code AST."""
    
    def __init__(self):
        self.symbol_table = []
        self.diagnostics = []
        self.declared_vars = {}  # {name: {line, scope, type, used}}
        self.current_scope = "global"
        self.scope_stack = ["global"]
    
    def analyze(self, cursor, source_file_path: str):
        """
        Main entry point for analysis.
        
        Args:
            cursor: Root cursor from libclang
            source_file_path: Path to the source file being analyzed
        """
        self.source_file = source_file_path
        self._traverse_for_symbols(cursor)
        self._check_unused_variables()
        self._check_infinite_loops(cursor)
        
        return {
            "symbolTable": self.symbol_table,
            "diagnostics": self.diagnostics
        }
    
    def _is_from_source(self, cursor) -> bool:
        """Check if cursor is from our source file, not headers."""
        if cursor.location.file:
            return cursor.location.file.name == self.source_file
        return False
    
    def _get_type_string(self, cursor) -> str:
        """Extract type string from cursor."""
        try:
            return cursor.type.spelling or "unknown"
        except:
            return "unknown"
    
    def _traverse_for_symbols(self, cursor, depth: int = 0):
        """Traverse AST to extract symbols and build symbol table."""
        
        # Handle scope changes
        if cursor.kind == CursorKind.FUNCTION_DECL:
            func_name = cursor.spelling
            self.scope_stack.append(func_name)
            self.current_scope = func_name
            
            # Add function to symbol table
            if self._is_from_source(cursor):
                self.symbol_table.append({
                    "name": func_name,
                    "kind": "function",
                    "type": self._get_type_string(cursor),
                    "scope": "global",
                    "line": cursor.location.line,
                    "column": cursor.location.column
                })
        
        # Variable declarations
        if cursor.kind == CursorKind.VAR_DECL and self._is_from_source(cursor):
            var_name = cursor.spelling
            var_type = self._get_type_string(cursor)
            
            self.symbol_table.append({
                "name": var_name,
                "kind": "variable",
                "type": var_type,
                "scope": self.current_scope,
                "line": cursor.location.line,
                "column": cursor.location.column
            })
            
            # Track for unused variable detection
            key = f"{self.current_scope}:{var_name}"
            self.declared_vars[key] = {
                "name": var_name,
                "line": cursor.location.line,
                "scope": self.current_scope,
                "used": False
            }
        
        # Parameter declarations
        if cursor.kind == CursorKind.PARM_DECL and self._is_from_source(cursor):
            param_name = cursor.spelling
            param_type = self._get_type_string(cursor)
            
            self.symbol_table.append({
                "name": param_name,
                "kind": "parameter",
                "type": param_type,
                "scope": self.current_scope,
                "line": cursor.location.line,
                "column": cursor.location.column
            })
            
            # Track for unused parameter detection
            key = f"{self.current_scope}:{param_name}"
            self.declared_vars[key] = {
                "name": param_name,
                "line": cursor.location.line,
                "scope": self.current_scope,
                "used": False
            }
        
        # Track variable references (usage)
        if cursor.kind == CursorKind.DECL_REF_EXPR:
            ref_name = cursor.spelling
            # Mark as used in current scope or global
            for scope in [self.current_scope, "global"]:
                key = f"{scope}:{ref_name}"
                if key in self.declared_vars:
                    self.declared_vars[key]["used"] = True
                    break
        
        # Recurse into children
        for child in cursor.get_children():
            self._traverse_for_symbols(child, depth + 1)
        
        # Pop scope when leaving function
        if cursor.kind == CursorKind.FUNCTION_DECL:
            self.scope_stack.pop()
            self.current_scope = self.scope_stack[-1] if self.scope_stack else "global"
    
    def _check_unused_variables(self):
        """Detect unused variables and parameters."""
        for key, info in self.declared_vars.items():
            if not info["used"]:
                self.diagnostics.append({
                    "severity": "warning",
                    "code": "W001",
                    "message": f"Unused variable '{info['name']}'",
                    "line": info["line"],
                    "scope": info["scope"]
                })
    
    def _check_infinite_loops(self, cursor):
        """Detect potential infinite loops."""
        self._check_infinite_loops_recursive(cursor)
    
    def _check_infinite_loops_recursive(self, cursor):
        """Recursively check for infinite loop patterns."""
        
        # Check for while(1) or while(true)
        if cursor.kind == CursorKind.WHILE_STMT and self._is_from_source(cursor):
            children = list(cursor.get_children())
            if children:
                condition = children[0]
                # Check for literal 1 or constant true
                if condition.kind == CursorKind.INTEGER_LITERAL:
                    # Get the literal value if possible
                    tokens = list(condition.get_tokens())
                    if tokens and tokens[0].spelling in ['1', 'true']:
                        # Check if there's a break statement in the body
                        has_break = self._has_break_statement(cursor)
                        if not has_break:
                            self.diagnostics.append({
                                "severity": "warning",
                                "code": "W002",
                                "message": "Potential infinite loop detected (while(1) without break)",
                                "line": cursor.location.line,
                                "scope": self.current_scope
                            })
        
        # Check for for(;;) - empty condition
        if cursor.kind == CursorKind.FOR_STMT and self._is_from_source(cursor):
            children = list(cursor.get_children())
            # for(;;) has minimal children and no condition
            if len(children) <= 1:
                has_break = self._has_break_statement(cursor)
                if not has_break:
                    self.diagnostics.append({
                        "severity": "warning", 
                        "code": "W002",
                        "message": "Potential infinite loop detected (for(;;) without break)",
                        "line": cursor.location.line,
                        "scope": self.current_scope
                    })
        
        # Recurse
        for child in cursor.get_children():
            self._check_infinite_loops_recursive(child)
    
    def _has_break_statement(self, cursor) -> bool:
        """Check if a loop body contains a break statement."""
        for child in cursor.get_children():
            if child.kind == CursorKind.BREAK_STMT:
                return True
            if self._has_break_statement(child):
                return True
        return False


def analyze_code(cursor, source_file_path: str) -> dict:
    """
    Convenience function to run static analysis.
    
    Args:
        cursor: Root cursor from libclang
        source_file_path: Path to source file
        
    Returns:
        dict with symbolTable and diagnostics
    """
    analyzer = StaticAnalyzer()
    return analyzer.analyze(cursor, source_file_path)
