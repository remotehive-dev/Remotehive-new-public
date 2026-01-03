import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'remotehive_admin.settings')
django.setup()

from autoscraper.services import fetch_rapid_jobs, fetch_serp_jobs, fetch_adzuna_jobs
from core.models import APIConfiguration

def run():
    print("--- Starting Manual Scrape Debug ---")
    
    # Check Configs
    configs = APIConfiguration.objects.filter(is_active=True)
    print(f"Found {configs.count()} active API configurations.")
    for c in configs:
        print(f"- {c.service_name}: {c.api_key[:10]}...")

    if configs.count() == 0:
        print("!! NO ACTIVE API CONFIGURATIONS FOUND !!")
        print("Please add API keys in the Admin Panel > Core > API Key Configurations")
        return

    # Run RapidAPI
    print("\nAttempting RapidAPI fetch...")
    count, error = fetch_rapid_jobs()
    if error:
        print(f"RapidAPI Error: {error}")
    else:
        print(f"RapidAPI Success: Fetched {count} jobs.")

    # Run SERP API
    print("\nAttempting SERP API fetch...")
    count, error = fetch_serp_jobs()
    if error:
        print(f"SERP API Error: {error}")
    else:
        print(f"SERP API Success: Fetched {count} jobs.")

    # Run Adzuna API
    print("\nAttempting Adzuna API fetch...")
    count, error = fetch_adzuna_jobs()
    if error:
        print(f"Adzuna API Error: {error}")
    else:
        print(f"Adzuna API Success: Fetched {count} jobs.")

    print("\n--- Done ---")

if __name__ == "__main__":
    run()
