import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'remotehive_admin.settings')
django.setup()

from core.models import APIConfiguration
from autoscraper.models import ScrapedJob, ScraperSource

def check():
    print("--- Checking Django Scraping Configuration ---")
    
    # 1. Check API Configs
    configs = APIConfiguration.objects.all()
    print(f"API Configurations found: {configs.count()}")
    for c in configs:
        print(f" - {c.service_name}: {'Active' if c.is_active else 'Inactive'}")
        
    if configs.count() == 0:
        print("WARNING: No API Configurations found. Scraping will not work.")
        print("Please add keys in Django Admin -> Core -> API Key Configurations")

    # 2. Check Scraper Sources
    sources = ScraperSource.objects.all()
    print(f"\nScraper Sources found: {sources.count()}")
    for s in sources:
        print(f" - {s.name}: Last scraped {s.last_scraped}")

    # 3. Check Scraped Jobs
    job_count = ScrapedJob.objects.count()
    print(f"\nTotal Scraped Jobs in DB: {job_count}")
    
    print("\n--- Check Complete ---")

if __name__ == "__main__":
    check()
