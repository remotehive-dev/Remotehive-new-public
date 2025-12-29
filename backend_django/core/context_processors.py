from .dashboard_stats import get_dashboard_stats

def dashboard_stats(request):
    # Only calculate stats for the admin index page to avoid performance hit on every request
    if request.path == '/admin/':
        return {'dashboard_stats': get_dashboard_stats()}
    return {}
