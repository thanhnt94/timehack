import os
import subprocess
import sys

def build_vite():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    client_dir = os.path.join(script_dir, "client")
    if not os.path.exists(client_dir):
        client_dir = os.path.join(script_dir, "frontend")
    
    print(f" [VITE] Building TimeHack Client at {client_dir}...")
    
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    
    try:
        bin_vite = os.path.join(client_dir, "node_modules", ".bin", "vite.cmd" if sys.platform == "win32" else "vite")
        if not os.path.exists(bin_vite):
            print(" [VITE] Installing dependencies...")
            subprocess.run([npm_cmd, "install"], cwd=client_dir, check=True)
            
        # Step 1: Type Checking to prevent runtime white screens / undefined variables
        print(" [VITE] Running TypeScript type check...")
        try:
            subprocess.run([npx_cmd, "tsc", "-p", "tsconfig.app.json", "--noEmit"], cwd=client_dir, check=True)
            print(" [VITE] TypeScript type check passed!")
        except Exception as te:
            print(f" [-] TypeScript compilation failed: {te}")
            sys.exit(1)
            
        # Step 2: Vite Build
        try:
            subprocess.run([npm_cmd, "run", "build"], cwd=client_dir, check=True)
        except Exception:
            print(" [VITE] Retrying with npx vite build...")
            subprocess.run([npx_cmd, "vite", "build"], cwd=client_dir, check=True)
            
        print(" [VITE] Build successful!")
    except subprocess.CalledProcessError as e:
        print(f" [VITE] Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    build_vite()
