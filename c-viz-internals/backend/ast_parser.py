"""
AST Parser Service using libclang.
Parses C source code and generates a recursive JSON AST structure.
"""

import uuid
from clang.cindex import Index, CursorKind, Config
from static_analyzer import analyze_code


def get_cursor_kind_name(cursor_kind: CursorKind) -> str:
    """Convert CursorKind enum to readable string."""
    return cursor_kind.name


def traverse_ast(cursor, main_file: str, depth: int = 0) -> dict:
    """
    Recursively traverse the AST and build a JSON-serializable structure.
    Only includes nodes from the main source file.
    
    Args:
        cursor: clang.cindex.Cursor object
        main_file: Path to the main source file (to filter out header nodes)
        depth: Current depth in the tree (for debugging)
    
    Returns:
        dict: Recursive AST node structure
    """
    # Get the name - cursor.spelling usually has what we need
    name = cursor.spelling or cursor.displayname or ""
    
    # Debug: log CALL_EXPR names to verify backend is running
    if cursor.kind == CursorKind.CALL_EXPR:
        print(f"[AST] Line {cursor.location.line}: CALL_EXPR name='{name}'")
    

    node = {
        "id": str(uuid.uuid4()),
        "type": get_cursor_kind_name(cursor.kind),
        "name": name,
        "line": cursor.location.line if cursor.location.file else 0,
        "column": cursor.location.column if cursor.location.file else 0,
        "children": []
    }
    
    # Traverse children
    for child in cursor.get_children():
        # Only include nodes from the main source file (not included headers)
        if child.location.file:
            # Compare file paths - only include if from main file
            child_file = child.location.file.name
            if child_file and os.path.normpath(child_file) == os.path.normpath(main_file):
                child_node = traverse_ast(child, main_file, depth + 1)
                node["children"].append(child_node)
        else:
            # Include nodes without file info (e.g., built-in types)
            child_node = traverse_ast(child, main_file, depth + 1)
            if child_node["children"] or child_node["name"]:
                node["children"].append(child_node)
    
    return node


def parse_c_code(source_code: str) -> dict:
    """
    Parse C source code and return a recursive AST structure.
    
    Args:
        source_code: C source code as a string
        
    Returns:
        dict: Recursive AST structure with id, type, name, line, and children
              Also includes symbolTable and diagnostics from static analysis
    """
    # Create a temporary file to store the C code
    # libclang requires a file to parse
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.c',
        delete=False,
        encoding='utf-8'
    ) as tmp_file:
        tmp_file.write(source_code)
        tmp_file_path = tmp_file.name
    
    try:
        # Get absolute path to backend/include
        current_dir = os.path.dirname(os.path.abspath(__file__))
        include_dir = os.path.join(current_dir, 'include')

        # Create an index
        index = Index.create()
        
        # Parse the translation unit
        translation_unit = index.parse(
            tmp_file_path,
            args=['-std=c11', '-I', include_dir],  # Use C11 standard and add include path
            options=0
        )
        
        # Check for parse errors
        errors = []
        for diag in translation_unit.diagnostics:
            if diag.severity >= 3:  # Error or Fatal
                errors.append({
                    "severity": diag.severity,
                    "message": diag.spelling,
                    "line": diag.location.line,
                    "column": diag.location.column
                })
        
        # Get the root cursor (translation unit)
        root_cursor = translation_unit.cursor
        
        # Build the AST (only nodes from the main source file)
        ast = traverse_ast(root_cursor, tmp_file_path)
        
        # Run static analysis
        analysis_result = analyze_code(root_cursor, tmp_file_path)
        
        # Add metadata
        result = {
            "success": True,
            "ast": ast,
            "errors": errors,
            "symbolTable": analysis_result["symbolTable"],
            "diagnostics": analysis_result["diagnostics"]
        }
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "ast": None,
            "errors": [{"message": str(e)}]
        }
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
