import os
import subprocess
import sys

def build_vite():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(script_dir, "frontend")
    
    print(f" [VITE] Building TimeHack Frontend at {frontend_dir}...")
    
    # Run npm run build
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        res = subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
        print(" [VITE] Build successful!")
    except subprocess.CalledProcessError as e:
        print(f" [VITE] Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    build_vite()
