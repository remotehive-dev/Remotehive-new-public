import os
from django.conf import settings
from django.contrib.auth import get_user_model
from autoscraper.models import ScrapedJob
from leads.models import Lead
from core.models import UserProfile

def get_dashboard_stats():
    stats = {
        "users_count": 0,
        "jobs_count": 0,
        "leads_count": 0,
        "active_campaigns": 0
    }

    # 1. Fetch Users from Local Django DB (Synced from Clerk)
    try:
        User = get_user_model()
        stats['users_count'] = User.objects.count()
    except Exception as e:
        print(f"DB Error: {e}")
        stats['users_count'] = "Error"

    # 2. Fetch Jobs from AutoScraper (Local SQLite)
    try:
        stats['jobs_count'] = ScrapedJob.objects.count()
    except Exception as e:
        print(f"DB Error: {e}")

    # 3. Fetch Leads (Local SQLite)
    try:
        stats['leads_count'] = Lead.objects.count()
    except Exception as e:
        print(f"DB Error: {e}")
        
    return stats
