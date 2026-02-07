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

    # Look for the bundled library from 'pip install libclang'
    import site
    site_packages = site.getsitepackages()
    
    potential_bundled_paths = []
    for sp in site_packages:
        # Common path for the libclang pypi package
        potential_bundled_paths.append(os.path.join(sp, 'clang', 'native', 'libclang.so'))
        potential_bundled_paths.append(os.path.join(sp, 'libclang', 'lib', 'libclang.so'))

    # Likely paths for libclang in Debian/Ubuntu based images (Fallback)
    system_paths = [
        '/usr/lib/llvm-14/lib/libclang.so.1',
        '/usr/lib/llvm-*/lib/libclang.so.1',
        '/usr/lib/x86_64-linux-gnu/libclang-*.so.1',
        '/usr/lib/libclang.so',
        '/usr/local/lib/libclang.so'
    ]
    
    paths = potential_bundled_paths + system_paths

    for pattern in paths:
        matches = glob.glob(pattern)
        if matches:
            print(f"[Backend] Found libclang at: {matches[0]}")
            Config.set_library_file(matches[0])
            return
    
    print("[Backend] Warning: Could not find libclang.so. relying on system default.")
