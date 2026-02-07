"""
Preprocessor Service using clang.
Runs the C preprocessor (clang -E) to expand macros and remove comments.
"""

import subprocess
import tempfile
import os

def preprocess_c_code(source_code: str) -> dict:
    """
    Run the C preprocessor on the source code.
    
    Args:
        source_code: C source code string
        
    Returns:
        dict with success status and preprocessed code or error
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

        # Run clang -E (preprocessor only)
        # -E: Run preprocessor stage
        # -C: Keep comments (optional, but usually preprocessed code has them removed. 
        #     User asked for "clean" expansion usually, but let's stick to standard behavior.
        #     Actually, let's omit -C to strip comments as per common expectation for "expanded" view)
        # -P: Disable linemarker output (makes it cleaner to read)
        process = subprocess.run(
            ['clang', '-E', '-P', '-I', include_dir, tmp_file_path],
            capture_output=True,
            text=True,
            check=False
        )
        
        if process.returncode == 0:
            return {
                "success": True,
                "preprocessed_code": process.stdout
            }
        else:
            return {
                "success": False,
                "error": process.stderr
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
