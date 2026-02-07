"""
Optimizer Service using clang.
Runs clang to generate LLVM IR with different optimization levels (O0 vs O3).
"""

import subprocess
import tempfile
import os

def optimize_code(source_code: str) -> dict:
    """
    Run clang to generate LLVM IR at O0 and O3 optimization levels.
    
    Args:
        source_code: C source code string
        
    Returns:
        dict with o0 and o3 LLVM IR code or error
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
        # Get absolute path to backend/include
        current_dir = os.path.dirname(os.path.abspath(__file__))
        include_dir = os.path.join(current_dir, 'include')
        
        # Run clang for O0 (No optimization)
        # -S: Only run preprocess and compilation steps
        # -emit-llvm: Use the LLVM representation for assembler and object files
        # -O0: No optimization
        # -I: Add include directory
        process_o0 = subprocess.run(
            ['clang', '-S', '-emit-llvm', '-O0', '-I', include_dir, tmp_file_path, '-o', '-'],
            capture_output=True,
            text=True,
            check=False
        )
        
        # Run clang for O3 (Max optimization)
        process_o3 = subprocess.run(
            ['clang', '-S', '-emit-llvm', '-O3', '-I', include_dir, tmp_file_path, '-o', '-'],
            capture_output=True,
            text=True,
            check=False
        )
        
        if process_o0.returncode == 0 and process_o3.returncode == 0:
            return {
                "success": True,
                "o0": process_o0.stdout,
                "o3": process_o3.stdout
            }
        else:
            error_msg = ""
            if process_o0.returncode != 0:
                error_msg += f"O0 Error: {process_o0.stderr}\n"
            if process_o3.returncode != 0:
                error_msg += f"O3 Error: {process_o3.stderr}"
            
            return {
                "success": False,
                "error": error_msg.strip()
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if os.path.exists(tmp_file_path):
            try:
                os.unlink(tmp_file_path)
            except:
                pass
