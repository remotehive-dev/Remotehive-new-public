import os
from django.conf import settings
from django.contrib.auth import get_user_model
from autoscraper.models import ScrapedJob
from leads.models import Lead
from core.models import UserProfile
from core.job_models import Job

def get_dashboard_stats():
    stats = {
        # Users
        "users_total": 0,
        "users_employers": 0,
        "users_jobseekers": 0,
        
        # Internal Jobs
        "jobs_internal_total": 0,
        "jobs_internal_published": 0,
        "jobs_internal_draft": 0,
        
        # Scraped Jobs
        "jobs_scraped_total": 0,
        "jobs_scraped_new": 0,
        "jobs_scraped_approved": 0,
        "jobs_scraped_rejected": 0,
        
        # Other
        "leads_count": 0,
    }

    try:
        User = get_user_model()
        stats['users_total'] = User.objects.count()
        stats['users_employers'] = UserProfile.objects.filter(role='employer').count()
        stats['users_jobseekers'] = UserProfile.objects.filter(role='jobseeker').count()
    except Exception as e:
        print(f"User Stats Error: {e}")

    try:
        stats['jobs_internal_total'] = Job.objects.count()
        stats['jobs_internal_published'] = Job.objects.filter(status='published').count()
        stats['jobs_internal_draft'] = Job.objects.filter(status='draft').count()
    except Exception as e:
        print(f"Internal Job Stats Error: {e}")

    try:
        stats['jobs_scraped_total'] = ScrapedJob.objects.count()
        stats['jobs_scraped_new'] = ScrapedJob.objects.filter(status='new').count()
        stats['jobs_scraped_approved'] = ScrapedJob.objects.filter(status='approved').count()
        stats['jobs_scraped_rejected'] = ScrapedJob.objects.filter(status='rejected').count()
    except Exception as e:
        print(f"Scraped Job Stats Error: {e}")

    try:
        stats['leads_count'] = Lead.objects.count()
    except Exception as e:
        print(f"Leads Stats Error: {e}")
        
    return stats
