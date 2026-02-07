"""
Control Flow Graph (CFG) Builder.
Constructs CFG from C code AST with basic blocks and control flow edges.
"""

import uuid
from clang.cindex import Index, CursorKind
import tempfile
import os


class BasicBlock:
    """Represents a basic block in the CFG."""
    
    def __init__(self, block_id: str, label: str = ""):
        self.id = block_id
        self.label = label
        self.statements = []
        self.successors = []  # List of block IDs
        self.is_entry = False
        self.is_exit = False
    
    def add_statement(self, stmt: str, line: int):
        self.statements.append({"text": stmt, "line": line})
    
    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "statements": self.statements,
            "isEntry": self.is_entry,
            "isExit": self.is_exit
        }


class CFGBuilder:
    """Builds Control Flow Graph from C code."""
    
    def __init__(self):
        self.blocks = {}  # id -> BasicBlock
        self.edges = []
        self.current_block = None
        self.block_counter = 0
        self.source_content = ""
        self.source_file = ""
    
    def new_block(self, label: str = "") -> BasicBlock:
        """Create a new basic block."""
        self.block_counter += 1
        block_id = f"block_{self.block_counter}"
        if not label:
            label = f"B{self.block_counter}"
        block = BasicBlock(block_id, label)
        self.blocks[block_id] = block
        return block
    
    def add_edge(self, from_id: str, to_id: str, label: str = ""):
        """Add an edge between two blocks."""
        edge = {
            "id": f"edge_{from_id}_{to_id}",
            "source": from_id,
            "target": to_id,
            "label": label
        }
        # Avoid duplicate edges
        if edge not in self.edges:
            self.edges.append(edge)
            if to_id not in self.blocks[from_id].successors:
                self.blocks[from_id].successors.append(to_id)
    
    def build_cfg(self, cursor, source_file: str) -> dict:
        """
        Build CFG from the AST cursor.
        
        Args:
            cursor: Root cursor from libclang
            source_file: Path to source file
            
        Returns:
            dict with nodes and edges for CFG
        """
        self.source_file = source_file
        
        # Read source content for text extraction
        # READ AS BINARY to match libclang byte offsets
        try:
            with open(source_file, 'rb') as f:
                self.source_content_bytes = f.read()
            # We also keep a decoded version if needed, but for extraction we use bytes
        except Exception as e:
            print(f"Error reading source file: {e}")
            self.source_content_bytes = b""
        
        # Find function declarations and build CFG for each
        for child in cursor.get_children():
            if child.kind == CursorKind.FUNCTION_DECL:
                if self._is_from_source(child):
                    self._build_function_cfg(child)
        
        # Clean up orphan blocks (empty blocks with no incoming edges)
        self._cleanup_orphan_blocks()
        
        # Convert to output format
        nodes = [block.to_dict() for block in self.blocks.values()]
        
        return {
            "nodes": nodes,
            "edges": self.edges
        }
    
    def _cleanup_orphan_blocks(self):
        """Remove empty blocks that have no incoming edges and no statements."""
        # Find blocks that are targets of edges
        target_blocks = set()
        for edge in self.edges:
            target_blocks.add(edge["target"])
        
        # Find orphan blocks to remove
        orphans = []
        for block_id, block in self.blocks.items():
            # Keep entry/exit blocks
            if block.is_entry or block.is_exit:
                continue
            # Remove if: no statements AND (no incoming edges OR no outgoing edges)
            if len(block.statements) == 0:
                if block_id not in target_blocks or len(block.successors) == 0:
                    orphans.append(block_id)
        
        # Remove orphan blocks
        for block_id in orphans:
            del self.blocks[block_id]
        
        # Remove edges referencing orphan blocks
        self.edges = [
            edge for edge in self.edges
            if edge["source"] not in orphans and edge["target"] not in orphans
        ]
    
    def _is_from_source(self, cursor) -> bool:
        """Check if cursor is from our source file."""
        if cursor.location.file:
            return cursor.location.file.name == self.source_file
        return False

    def _get_cursor_text(self, cursor) -> str:
        """Extract exact text from source for a given cursor."""
        if not self.source_content_bytes:
            return ""
            
        # libclang extents are 1-based line, 1-based column
        # But offsets are simpler if available
        start_offset = cursor.extent.start.offset
        end_offset = cursor.extent.end.offset
        
        if 0 <= start_offset < len(self.source_content_bytes) and 0 < end_offset <= len(self.source_content_bytes):
            extracted_bytes = self.source_content_bytes[start_offset:end_offset]
            try:
                return extracted_bytes.decode('utf-8')
            except UnicodeDecodeError:
                return extracted_bytes.decode('utf-8', errors='replace')
        
        return ""

    def _get_statement_text(self, cursor) -> str:
        """Get a readable representation of a statement."""
        kind = cursor.kind
        name = cursor.spelling or ""
        
        if kind == CursorKind.RETURN_STMT:
            # Try to get full return statement text
            text = self._get_cursor_text(cursor)
            return text if text else "return"
        elif kind == CursorKind.CALL_EXPR:
            return f"{name}()"
        elif kind == CursorKind.VAR_DECL:
            # improved: get full declaration
            text = self._get_cursor_text(cursor)
            # truncate if too long
            if len(text) > 30:
                return f"{text[:27]}..."
            return text if text else f"int {name}"
        elif kind == CursorKind.BINARY_OPERATOR:
             # improved: get full expression
            text = self._get_cursor_text(cursor)
            if len(text) > 30:
                return f"{text[:27]}..."
            return text if text else f"{name} = ..."
        elif kind == CursorKind.DECL_STMT:
            # Get variable name from children
            for child in cursor.get_children():
                if child.kind == CursorKind.VAR_DECL:
                    text = self._get_cursor_text(child)
                    return text if text else f"decl {child.spelling}"
            return "decl"
        elif kind == CursorKind.COMPOUND_STMT:
            return None  # Don't add compound statements
        else:
            # Fallback to source text
            text = self._get_cursor_text(cursor)
            if text:
                 if len(text) > 30:
                    return f"{text[:27]}..."
                 return text
            return kind.name.replace('_', ' ').lower()
    
    def _build_function_cfg(self, func_cursor):
        """Build CFG for a single function."""
        func_name = func_cursor.spelling
        
        # Create entry block
        entry_block = self.new_block(f"Entry: {func_name}")
        entry_block.is_entry = True
        
        # Create exit block
        exit_block = self.new_block(f"Exit: {func_name}")
        exit_block.is_exit = True
        
        # Find the compound statement (function body)
        for child in func_cursor.get_children():
            if child.kind == CursorKind.COMPOUND_STMT:
                # Process the function body
                last_block = self._process_block(child, entry_block, exit_block)
                
                # Connect last block to exit if not already connected
                if last_block and last_block.id != exit_block.id:
                    if exit_block.id not in last_block.successors:
                        self.add_edge(last_block.id, exit_block.id)
    
    def _process_block(self, cursor, current_block: BasicBlock, exit_block: BasicBlock) -> BasicBlock:
        """
        Process statements and build CFG structure.
        Returns the last block in the sequence.
        """
        for child in cursor.get_children():
            if not self._is_from_source(child):
                continue
                
            kind = child.kind
            
            if kind == CursorKind.IF_STMT:
                current_block = self._process_if(child, current_block, exit_block)
            
            elif kind == CursorKind.WHILE_STMT:
                current_block = self._process_while(child, current_block, exit_block)
            
            elif kind == CursorKind.FOR_STMT:
                current_block = self._process_for(child, current_block, exit_block)
            
            elif kind == CursorKind.RETURN_STMT:
                # Use source text for return
                stmt_text = self._get_cursor_text(child)
                current_block.add_statement(stmt_text or "return", child.location.line)
                self.add_edge(current_block.id, exit_block.id)
                # Create new block for unreachable code
                current_block = self.new_block()
            
            elif kind == CursorKind.COMPOUND_STMT:
                current_block = self._process_block(child, current_block, exit_block)
            
            else:
                # Regular statement - add to current block
                stmt_text = self._get_statement_text(child)
                if stmt_text:
                    current_block.add_statement(stmt_text, child.location.line)
        
        return current_block
    
    def _process_if(self, cursor, current_block: BasicBlock, exit_block: BasicBlock) -> BasicBlock:
        """Process if statement."""
        children = list(cursor.get_children())
        
        # Extract condition text
        cond_text = "if (?)"
        # The first child is usually the condition expression in Clang AST for IF_STMT
        # We need to verify if it's not the body. Bodies are usually CompoundStmt.
        # But simple bodies can be other stmts. 
        # Clang AST structure for IF: [Condition, ThenBody, ElseBody(optional)]
        # We rely on this order.
        
        if children:
            cond_cursor = children[0]
            cond_expr = self._get_cursor_text(cond_cursor)
            cond_text = f"if ({cond_expr})"
        
        # Add condition to current block
        current_block.add_statement(cond_text, cursor.location.line)
        
        # Create blocks for then and else branches
        then_block = self.new_block("then")
        merge_block = self.new_block("merge")
        
        # Edge from condition to then
        self.add_edge(current_block.id, then_block.id, "true")
        
        # Process then branch (child 1)
        if len(children) > 1:
            last_then = self._process_block_single(children[1], then_block, exit_block)
            if last_then and exit_block.id not in last_then.successors:
                self.add_edge(last_then.id, merge_block.id)
        
        # Check for else branch (child 2)
        if len(children) > 2:
            else_block = self.new_block("else")
            self.add_edge(current_block.id, else_block.id, "false")
            last_else = self._process_block_single(children[2], else_block, exit_block)
            if last_else and exit_block.id not in last_else.successors:
                self.add_edge(last_else.id, merge_block.id)
        else:
            # No else - direct edge to merge
            self.add_edge(current_block.id, merge_block.id, "false")
        
        return merge_block
    
    def _process_while(self, cursor, current_block: BasicBlock, exit_block: BasicBlock) -> BasicBlock:
        """Process while loop - creates back edge for cycle."""
        children = list(cursor.get_children())
        
        # Extract condition
        cond_text = "while (?)"
        if children:
            cond_cursor = children[0]
            cond_expr = self._get_cursor_text(cond_cursor)
            cond_text = f"while ({cond_expr})"
        
        # Create condition block
        cond_block = self.new_block("while cond")
        cond_block.add_statement(cond_text, cursor.location.line)
        
        # Edge from current to condition
        self.add_edge(current_block.id, cond_block.id)
        
        # Create body block
        body_block = self.new_block("loop body")
        
        # Create exit block for the loop
        after_loop = self.new_block("after loop")
        
        # True edge -> body
        self.add_edge(cond_block.id, body_block.id, "true")
        
        # False edge -> after loop
        self.add_edge(cond_block.id, after_loop.id, "false")
        
        # Process body (child 1)
        if len(children) > 1:
            last_body = self._process_block_single(children[1], body_block, exit_block)
            # Back edge - THIS CREATES THE CYCLE
            if last_body and exit_block.id not in last_body.successors:
                self.add_edge(last_body.id, cond_block.id, "loop back")
        
        return after_loop
    
    def _process_for(self, cursor, current_block: BasicBlock, exit_block: BasicBlock) -> BasicBlock:
        """Process for loop - similar to while but with init and inc."""
        children = list(cursor.get_children())
        
        # For loops in Clang can be tricky.
        # They usually have: Init (optional), Check (optional), Update (optional), Body.
        # Since we can't easily distinguish them by position (some might be null/missing in AST if omitted),
        # we will try to identify them or use the raw text parsing as a fallback/enhancement.
        
        # However, Clang's python binding `get_children` dumps them in order.
        # But we don't know which is which type easily without checking StmtClass or CursorKind which might be generic STMT.
        
        # A robust way is to rely on the fact that children are [Init, Cond, Inc, Body] roughly.
        # But wait, `debug_cfg_ast.py` showed:
        # Child 0 (DECL_STMT): 'int i = 0;'  <- Init
        # Child 1 (BINARY_OPERATOR): 'i < 10' <- Cond
        # Child 2 (UNARY_OPERATOR): 'i++'    <- Inc
        # Child 3 (COMPOUND_STMT): ...       <- Body
        
        # If any is missing, it skips in children list? No, usually Clang includes them or not.
        # Actually, let's use the cursors we have.
        
        # We need to map children to roles.
        # We can iterate and try to guess, OR assume standard structure.
        # Let's assume the standard valid for-loop has 4 children.
        # If fewer, it's harder.
        
        # Strategy: 
        # 1. Identify Body (last child usually).
        # 2. Identify Init (first child usually if Decl or BinaryOp).
        # 3. Identify Cond (BinaryOp typically).
        # 4. Identify Inc (UnaryOp or BinaryOp).
        
        # Simplified approach: 
        # - Init is whatever is before Cond.
        # - Cond is the one before Body and Inc?
        # - Inc is the one before Body?
        
        # Actually, `debug_cfg_ast` showed a clear 4-child structure for a full loop.
        # Let's handle the 4-child case explicitly, and fallback for others.
        
        if len(children) == 4:
            init_c, cond_c, inc_c, body_c = children
        elif len(children) == 3:
            # Maybe Init is missing? Or Inc is missing?
            # Hard to guess perfectly without more complex logic.
            # Let's assume [Init, Cond, Body] implies Inc is missing?
            # Or [Cond, Inc, Body]? 
            # We'll just take the first as Init, second as Cond... this might be wrong.
            # A safer UI approach: Just extract text for Init/Cond/Inc from the `for (...)` string.
            
            # Let's try extracting from the `for` statement text itself.
            for_text = self._get_cursor_text(cursor)
            # split by ; inside ()
            # Find first ( and last )
            start_paren = for_text.find('(')
            end_paren = for_text.rfind(')')
            
            if start_paren != -1 and end_paren != -1:
                header = for_text[start_paren+1:end_paren]
                parts = header.split(';')
                
                # We can't easily map these strings to Blocks because we want to process the *logic* (sub-ASTs)
                # but for VISUALIZATION, just showing text is enough.
                # BUT we need blocks for them in the graph.
                pass

            # Fallback to standard flow even if labels are generic
            init_c = children[0]
            cond_c = children[1]
            body_c = children[-1]
            inc_c = None # Assume missing
        else:
             # Minimal fallback
             init_c = children[0] if children else None
             cond_c = None
             inc_c = None
             body_c = children[-1] if children else None

        
        # Init block
        init_block = self.new_block("for init")
        if init_c and init_c != body_c:
             init_text = self._get_cursor_text(init_c)
             init_block.add_statement(init_text if init_text else "init", cursor.location.line)
        else:
             init_block.add_statement("for init", cursor.location.line)
             
        self.add_edge(current_block.id, init_block.id)
        
        # Condition block
        cond_block = self.new_block("for cond")
        if cond_c and cond_c != body_c:
             cond_text = self._get_cursor_text(cond_c)
             cond_block.add_statement(f"for ({cond_text})", cursor.location.line)
        else:
             cond_block.add_statement("for cond", cursor.location.line)
             
        self.add_edge(init_block.id, cond_block.id)
        
        # Increment block (new!)
        inc_block = self.new_block("for inc")
        if inc_c and inc_c != body_c:
             inc_text = self._get_cursor_text(inc_c)
             inc_block.add_statement(inc_text if inc_text else "inc", cursor.location.line)
        else:
              inc_block.add_statement("inc", cursor.location.line)

        # Body block
        body_block = self.new_block("for body")
        
        # After loop
        after_loop = self.new_block("after for")
        
        # True -> body
        self.add_edge(cond_block.id, body_block.id, "true")
        
        # False -> after
        self.add_edge(cond_block.id, after_loop.id, "false")
        
        # Process body
        if body_c:
            if body_c.kind == CursorKind.COMPOUND_STMT:
                last_body = self._process_block(body_c, body_block, exit_block)
            else:
                 # Single stmt body
                stmt_text = self._get_statement_text(body_c)
                if stmt_text:
                    body_block.add_statement(stmt_text, body_c.location.line)
                last_body = body_block
            
            # Back edge: Body -> Inc -> Cond
            if last_body and exit_block.id not in last_body.successors:
                # Instead of going straight to Cond, go to Inc
                self.add_edge(last_body.id, inc_block.id)
                self.add_edge(inc_block.id, cond_block.id, "loop back")
        else:
            # Empty body?
             self.add_edge(body_block.id, inc_block.id)
             self.add_edge(inc_block.id, cond_block.id, "loop back")

        return after_loop
    
    def _process_block_single(self, cursor, block: BasicBlock, exit_block: BasicBlock) -> BasicBlock:
        """Process a single statement or compound statement."""
        if cursor.kind == CursorKind.COMPOUND_STMT:
            return self._process_block(cursor, block, exit_block)
        else:
            stmt_text = self._get_statement_text(cursor)
            if stmt_text:
                block.add_statement(stmt_text, cursor.location.line)
            
            if cursor.kind == CursorKind.RETURN_STMT:
                self.add_edge(block.id, exit_block.id)
                return None
            
            return block


def build_cfg(source_code: str) -> dict:
    """
    Build CFG from C source code.
    
    Args:
        source_code: C source code string
        
    Returns:
        dict with nodes and edges for CFG visualization
    """
    # Create temp file
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.c',
        delete=False,
        encoding='utf-8'
    ) as tmp_file:
        tmp_file.write(source_code)
        tmp_file_path = tmp_file.name
    
    try:
        index = Index.create()
        translation_unit = index.parse(
            tmp_file_path,
            args=['-std=c11'],
            options=0
        )
        
        builder = CFGBuilder()
        cfg = builder.build_cfg(translation_unit.cursor, tmp_file_path)
        
        return {
            "success": True,
            "cfg": cfg
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "cfg": {"nodes": [], "edges": []}
        }
    finally:
        if os.path.exists(tmp_file_path):
            try:
                os.unlink(tmp_file_path)
            except:
                pass
