import os
import subprocess
import time
import socket
import sys
import urllib.request
import urllib.error

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SERVICES = [
    {
        "name": "Admin Panel",
        "path": os.path.join(PROJECT_ROOT, "remotehive-admin"),
        "command": ["npm", "run", "dev"],
        "port": 3000,
        "type": "frontend"
    },
    {
        "name": "Public Website",
        "path": os.path.join(PROJECT_ROOT, "remotehive-public"),
        "command": ["npm", "run", "dev"],
        "port": 5173,
        "type": "frontend"
    },
    {
        "name": "FastAPI Backend",
        "path": PROJECT_ROOT,
        "command": ["uvicorn", "app.main:app", "--reload", "--port", "8000"],
        "port": 8000,
        "type": "backend"
    },
    {
        "name": "Django Super Admin",
        "path": os.path.join(PROJECT_ROOT, "backend_django"),
        "command": [sys.executable, "manage.py", "runserver", "8001"],
        "port": 8001,
        "type": "backend"
    },
    {
        "name": "Open Resume",
        "path": os.path.join(PROJECT_ROOT, "open-resume"),
        "command": ["npm", "run", "dev", "--", "-p", "3001"],
        "port": 3001,
        "type": "frontend"
    },
    {
        "name": "Redis Server",
        "path": PROJECT_ROOT,
        "command": ["redis-server", "--port", "6379"],
        "port": 6379,
        "type": "database"
    }
]

# External Service Configs (will be read from .env)
ENV_CHECKS = {
    "public": os.path.join(PROJECT_ROOT, "remotehive-public", ".env"),
    "admin": os.path.join(PROJECT_ROOT, "remotehive-admin", ".env")
}

def load_env_file(filepath):
    """Simple .env parser"""
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    return env_vars

import ssl

def is_port_in_use(port):
    # Check both IPv4 and IPv6/localhost
    for host in ['127.0.0.1', 'localhost']:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                if s.connect_ex((host, port)) == 0:
                    return True
        except:
            pass
    return False

def kill_process_on_port(port):
    """Kills process running on specified port"""
    try:
        # Find PID
        cmd = f"lsof -t -i:{port}"
        pid = subprocess.check_output(cmd, shell=True).decode().strip()
        if pid:
            print(f"⚠️  Killing process {pid} on port {port}...")
            subprocess.run(f"kill -9 {pid}", shell=True, check=True)
            return True
    except subprocess.CalledProcessError:
        pass # No process found
    return False

def check_url_health(name, url):
    """Checks if a URL is reachable"""
    try:
        # Create unverified SSL context to handle macOS python cert issues
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'RemoteHive-Startup-Script')
        
        with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
            return True, f"Status: {response.status}"
    except urllib.error.HTTPError as e:
        return True, f"Status: {e.code} (Reachable)"
    except Exception as e:
        return False, str(e)

def main():
    print("🚀 Starting RemoteHive Development Environment...")
    print("===============================================")

    # 1. Clear running services
    print("\n🧹 Cleaning up existing processes...")
    ports_to_clear = [s['port'] for s in SERVICES] + [8000, 8001] # Include backend ports just in case
    for port in ports_to_clear:
        kill_process_on_port(port)
    
    # 2. Start Services
    print("\n⚡ Starting Services...")
    processes = []
    log_dir = os.path.join(PROJECT_ROOT, "logs")
    os.makedirs(log_dir, exist_ok=True)

    for service in SERVICES:
        print(f"   ► Starting {service['name']} on port {service['port']}...")
        
        # Redirect output to log files
        stdout_log = open(os.path.join(log_dir, f"{service['name'].lower().replace(' ', '_')}.out.log"), "w")
        stderr_log = open(os.path.join(log_dir, f"{service['name'].lower().replace(' ', '_')}.err.log"), "w")
        
        try:
            p = subprocess.Popen(
                service['command'],
                cwd=service['path'],
                stdout=stdout_log,
                stderr=stderr_log
            )
            processes.append(p)
            # Give it a moment to initialize
            time.sleep(2)
        except Exception as e:
            print(f"   ❌ Failed to start {service['name']}: {e}")

    # 3. Verify Local Services
    print("\n🔍 Verifying Local Services...")
    time.sleep(5) # Wait a bit for nodes to start
    for service in SERVICES:
        if is_port_in_use(service['port']):
            print(f"   ✅ {service['name']} is running on port {service['port']}")
        else:
            print(f"   ❌ {service['name']} failed to start on port {service['port']}")

    # 4. Check External Integrations
    print("\nwm🌍 Checking External Integrations...")
    
    # Load envs
    public_env = load_env_file(ENV_CHECKS["public"])
    
    # Supabase
    supabase_url = public_env.get("VITE_SUPABASE_URL")
    if supabase_url:
        ok, msg = check_url_health("Supabase", supabase_url)
        print(f"   {'✅' if ok else '❌'} Supabase: {msg} ({supabase_url})")
    else:
        print("   ⚠️  Supabase URL not found in .env")

    # Appwrite
    appwrite_url = public_env.get("VITE_APPWRITE_ENDPOINT")
    if appwrite_url:
        ok, msg = check_url_health("Appwrite", appwrite_url)
        print(f"   {'✅' if ok else '❌'} Appwrite: {msg} ({appwrite_url})")
    else:
        print("   ⚠️  Appwrite Endpoint not found in .env")

    # Backend API (External)
    backend_url = "http://localhost:8000"
    if is_port_in_use(8000):
         print(f"   ✅ Backend API is detected on port 8000")
    else:
         print(f"   ⚠️  Backend API is NOT running on port 8000 (External Repo)")

    print("\n===============================================")
    print("✨ Startup Sequence Complete!")
    print(f"📝 Logs are being written to: {log_dir}")
    print("   (Press Ctrl+C to stop all services)")

    try:
        # Keep script running to maintain child processes
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping services...")
        for p in processes:
            p.terminate()
        print("Done.")

if __name__ == "__main__":
    main()
