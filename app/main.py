
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings
import time
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audit")

from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=None,  # Disable default Swagger UI
    redoc_url=None
)

# Trust Proxy Headers (for SSL termination on Railway)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# Audit Middleware
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log admin actions
    if request.url.path.startswith("/api/v1/admin") and request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        logger.info(f"AUDIT: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
    
    return response

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8001",
]

cors_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
if cors_origins_env:
    origins.extend([origin.strip() for origin in cors_origins_env.split(",") if origin.strip()])

cors_origin_regex = os.environ.get("CORS_ORIGIN_REGEX", "").strip() or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=cors_origin_regex,
)

from app.docs_endpoint import custom_docs

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/docs", include_in_schema=False)
def docs_route():
    return custom_docs()

@app.get("/", response_class=HTMLResponse)
def root():
    admin_panel_url = os.environ.get("ADMIN_PANEL_URL", "http://localhost:3000")
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RemoteHive Super Admin</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body {{ font-family: 'Inter', sans-serif; }}
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
        <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div class="bg-indigo-600 p-6 text-center">
                <h1 class="text-2xl font-bold text-white">RemoteHive System</h1>
                <p class="text-indigo-100 mt-1">Super Admin Control Plane</p>
            </div>
            
            <div class="p-6 space-y-6">
                <!-- Status -->
                <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-sm font-medium text-green-900">System Operational</span>
                    </div>
                    <span class="text-xs font-mono text-green-700">v1.0.0</span>
                </div>

                <!-- Actions -->
                <div class="space-y-3">
                    <a href="/docs" class="block w-full group">
                        <div class="flex items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                            <div class="p-2 bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="font-semibold text-gray-900">API Documentation</h3>
                                <p class="text-sm text-gray-500">Interactive Swagger UI</p>
                            </div>
                            <div class="ml-auto">
                                <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    </a>

                    <a href="{admin_panel_url}" target="_blank" class="block w-full group">
                        <div class="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all">
                            <div class="p-2 bg-purple-100 rounded-md group-hover:bg-purple-200">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="font-semibold text-gray-900">Admin Dashboard</h3>
                                <p class="text-sm text-gray-500">Visual Control Panel</p>
                            </div>
                            <div class="ml-auto">
                                <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 border-t border-gray-100 text-center text-xs text-gray-400">
                RemoteHive System v1.0.0 &bull; Running on FastAPI
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/health")
def health_check():
    return {"status": "healthy"}
