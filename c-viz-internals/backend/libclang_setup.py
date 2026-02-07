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

    # Likely paths for libclang in Debian/Ubuntu based images
    paths = [
        '/usr/lib/llvm-*/lib/libclang.so.1',
        '/usr/lib/x86_64-linux-gnu/libclang-*.so.1',
        '/usr/lib/libclang.so',
        '/usr/local/lib/libclang.so'
    ]

    for pattern in paths:
        matches = glob.glob(pattern)
        if matches:
            print(f"[Backend] Found libclang at: {matches[0]}")
            Config.set_library_file(matches[0])
            return
    
    print("[Backend] Warning: Could not find libclang.so. relying on system default.")
