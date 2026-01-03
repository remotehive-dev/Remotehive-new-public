from django.shortcuts import render
from django.contrib.auth.decorators import user_passes_test
from django.utils import timezone
from .models import ScraperSource, ScrapedJob
from core.models import APIConfiguration
from .services import test_api_connection

@user_passes_test(lambda u: u.is_superuser)
def scraper_stats_view(request):
    # 1. Source Stats
    sources = ScraperSource.objects.all()
    source_stats = []
    for source in sources:
        success, msg = "Unknown", "No test run"
        name_lower = source.name.lower()
        
        if "rapidapi" in name_lower and "linkedin" not in name_lower:
            success, msg = test_api_connection('rapidapi')
        elif "linkedin" in name_lower:
            success, msg = test_api_connection('linkedin')
        elif "serp" in name_lower or "google" in name_lower:
            success, msg = test_api_connection('serp')
        elif "openweb" in name_lower or "ninja" in name_lower:
            success, msg = test_api_connection('openwebninja')
            
        source_stats.append({
            'name': source.name,
            'last_scraped': source.last_scraped,
            'is_active': source.is_active,
            'connection_status': success,
            'connection_msg': msg
        })

    # 2. Job Stats
    total_jobs = ScrapedJob.objects.count()
    new_jobs = ScrapedJob.objects.filter(status='new').count()
    approved_jobs = ScrapedJob.objects.filter(status='approved').count()
    rejected_jobs = ScrapedJob.objects.filter(status='rejected').count()
    
    # 3. API Configs
    configs = APIConfiguration.objects.all()

    context = {
        'title': 'Scraper Statistics & Health',
        'source_stats': source_stats,
        'job_stats': {
            'total': total_jobs,
            'new': new_jobs,
            'approved': approved_jobs,
            'rejected': rejected_jobs
        },
        'api_configs': configs,
        'last_updated': timezone.now()
    }
    
    return render(request, 'admin/autoscraper/stats.html', context)
