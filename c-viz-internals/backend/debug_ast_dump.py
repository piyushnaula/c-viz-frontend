import sys
from clang.cindex import Index, CursorKind, Config
import os
from libclang_setup import configure_libclang

# Configure environment
configure_libclang()

code = """
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
"""

def print_tree(cursor, depth=0):
    indent = "  " * depth
    kind_name = cursor.kind.name
    spelling = cursor.spelling or cursor.displayname
    print(f"{indent}{kind_name} : {spelling}")
    
    for child in cursor.get_children():
        print_tree(child, depth + 1)

def main():
    print("--- Dumping Raw AST ---")
    index = Index.create()
    
    # We need to include system headers for printf to ensure it parses correctly as a CallExpr
    # typically libclang will find them if installed, but let's try basic parse first
    
    # Create temp file
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.c', delete=False) as f:
        f.write(code)
        fname = f.name
        
    try:
        tu = index.parse(fname)
        
        # Find main function to start dump from, to avoid dumping all of stdio.h
        print("Finding main...")
        for child in tu.cursor.get_children():
            if child.spelling == 'main':
                print_tree(child)
                break
                
    finally:
        if os.path.exists(fname):
            os.unlink(fname)

if __name__ == "__main__":
    main()
