import glob
import os
from clang.cindex import Config

def configure_libclang():
    """
    Manually configure libclang path if not found automatically.
    This is necessary for some Docker environments (Debian/Ubuntu).
    """
    if Config.library_file:
        return

    # Search in all python paths (site-packages)
    import sys
    
    print(f"[Backend] Searching for libclang in sys.path...")
    
    found_lib = None
    
    # Patterns to look for the bundled library
    # The 'libclang' PyPI package typically puts it in 'native' folder or root of package
    relative_patterns = [
        os.path.join('libclang', 'native', 'libclang.so'),
        os.path.join('libclang', 'lib', 'libclang.so'),
        os.path.join('clang', 'native', 'libclang.so'),
        os.path.join('clang', 'libclang.so')
    ]

    for path in sys.path:
        for pattern in relative_patterns:
            full_path = os.path.join(path, pattern)
            if os.path.exists(full_path):
                found_lib = full_path
                break
        if found_lib:
            break
            
    if found_lib:
        print(f"[Backend] Found bundled libclang at: {found_lib}")
        Config.set_library_file(found_lib)
    else:
        print("[Backend] CRITICAL: Could not find bundled libclang in site-packages.")
        print(f"[Backend] sys.path checked: {sys.path}")
        # We purposely do NOT fallback to system paths to avoid the v19 mismatch.
        # If this fails, we want it to fail here so we know the pip install didn't work as expected.
