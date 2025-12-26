from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.conf import settings

@staff_member_required
def api_docs_view(request):
    """
    Renders the FastAPI Swagger UI inside the Django Admin.
    Protected by Django Admin authentication.
    """
    # Assuming FastAPI is running on port 8000 locally
    # In production, this URL should be updated or proxied
    # Note: FastAPI serves openapi.json at /api/v1/openapi.json based on app/main.py config
    openapi_url = "http://localhost:8000/api/v1/openapi.json"
    
    context = {
        "openapi_url": openapi_url,
        "title": "RemoteHive Backend API Docs",
        "site_header": getattr(settings, 'JAZZMIN_SETTINGS', {}).get('site_header', 'RemoteHive'),
    }
    return render(request, "admin/api_docs.html", context)

@staff_member_required
def proxy_openapi(request):
    import requests
    from django.http import JsonResponse, HttpResponse
    try:
        response = requests.get("http://localhost:8000/api/v1/openapi.json")
        return JsonResponse(response.json(), safe=False)
    except Exception as e:
        return HttpResponse(f"Error connecting to FastAPI: {e}", status=502)
