import requests
import logging
import time
from datetime import datetime
from django.utils import timezone
from core.models import APIConfiguration
from .models import ScrapedJob, ScraperSource, Company
from .logo_service import LogoFetchService

logger = logging.getLogger(__name__)

def get_api_configs(service_name):
    """Returns a queryset of active configurations for rotation."""
    return APIConfiguration.objects.filter(service_name=service_name, is_active=True)

def get_api_config(service_name):
    """Returns the first active configuration."""
    return APIConfiguration.objects.filter(service_name=service_name, is_active=True).first()

def test_api_connection(service_name):
    """
    Tests the connection to the specified service by making a minimal request.
    Returns (success: bool, message: str)
    """
    config = get_api_config(service_name)
    if not config:
        return False, "Configuration not found or inactive."

    try:
        if service_name == 'rapidapi':
            url = config.base_url or "https://active-jobs-db.p.rapidapi.com/active-ats-7d"
            headers = {
                'x-rapidapi-host': "active-jobs-db.p.rapidapi.com",
                'x-rapidapi-key': config.api_key
            }
            # Minimal request
            params = {'limit': '1', 'offset': '0', 'title_filter': '"Test"'}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! RapidAPI responded."

        elif service_name == 'linkedin':
            # Use the config base_url ONLY if it's set and non-empty
            # Otherwise use the default working endpoint
            # Handle case where user puts base URL without endpoint path
            if config.base_url and config.base_url.strip():
                url = config.base_url.strip()
                # If user entered just the domain root (common mistake), append the endpoint
                if url.endswith('rapidapi.com') or url.endswith('rapidapi.com/'):
                     if not url.endswith('/'):
                         url += '/'
                     url += 'active-jb-24h'
            else:
                url = "https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h"
            
            headers = {
                'x-rapidapi-host': "linkedin-job-search-api.p.rapidapi.com",
                'x-rapidapi-key': config.api_key
            }
            # Minimal request to test connection
            params = {
                'limit': '1', 
                'offset': '0', 
                'title_filter': '"Test"',
                'description_type': 'text'
            }
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! LinkedIn Job Search API responded."

        elif service_name == 'serp':
            url = "https://serpapi.com/search.json"
            params = {
                'engine': 'google_jobs',
                'q': 'Test',
                'api_key': config.api_key,
                'num': '1'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! SERP API responded."

        elif service_name == 'openwebninja':
            url = "https://api.openwebninja.com/jsearch/search"
            headers = {
                'x-api-key': config.api_key
            }
            params = {
                'query': 'developer jobs',
                'num_pages': '1'
            }
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! OpenWebNinja API responded."

        elif service_name == 'google_custom':
            # Basic test for Google Custom Search
            if not config.extra_config or not config.extra_config.get('cx'):
                 return False, "Missing 'cx' (Search Engine ID) in extra_config."
            
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': config.api_key,
                'cx': config.extra_config.get('cx'),
                'q': 'test',
                'num': '1'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! Google Custom Search API responded."
            
        elif service_name == 'adzuna':
            # Test Adzuna
            app_id = config.extra_config.get('app_id') if config.extra_config else None
            if not app_id:
                 return False, "Missing 'app_id' in extra_config."
            
            # Default to US for testing
            country = config.extra_config.get('country', 'us')
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {
                'app_id': app_id,
                'app_key': config.api_key,
                'results_per_page': '1',
                'what': 'developer',
                'content-type': 'application/json'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! Adzuna API responded."

        else:
            return False, f"Unknown service: {service_name}"

    except requests.exceptions.RequestException as e:
        return False, f"Connection failed: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def fetch_rapid_jobs(limit=10, query="Data Engineer", location_filter='"United States" OR "United Kingdom"'):
    configs = get_api_configs('rapidapi')
    if not configs.exists():
        return 0, "No active RapidAPI configuration found."

    # Query construction based on user cURL
    params = {
        'limit': str(limit),
        'offset': '0',
        'title_filter': f'"{query}"',
        'location_filter': location_filter,
        'description_type': 'text'
    }

    last_error = None
    
    for config in configs:
        api_key = config.api_key
        url = config.base_url if config.base_url else "https://active-jobs-db.p.rapidapi.com/active-ats-7d"
        
        headers = {
            'x-rapidapi-host': "active-jobs-db.p.rapidapi.com",
            'x-rapidapi-key': api_key
        }

        retries = 3
        for attempt in range(retries):
            try:
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code == 429:
                    logger.warning(f"Rate limit hit for key ending in ...{api_key[-4:]}. Retrying in {2**attempt}s...")
                    time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                    continue
                
                if response.status_code == 401:
                    logger.warning(f"Unauthorized (401) for key ending in ...{api_key[-4:]}. Trying next key.")
                    last_error = "Unauthorized API Key"
                    break # Break inner loop to try next config
                
                response.raise_for_status()
                data = response.json()
                
                # ... Process Data ...
                count = 0
                source, _ = ScraperSource.objects.get_or_create(
                    name="RapidAPI - Active Jobs DB",
                    defaults={'url': "https://rapidapi.com/active-jobs-db"}
                )
                
                logo_service = LogoFetchService()

                for item in data:
                    job_url = item.get('url')
                    if not job_url:
                        continue
                        
                    if ScrapedJob.objects.filter(url=job_url).exists():
                        continue

                    locations = item.get('locations_derived', [])
                    location = locations[0] if locations else "Unknown"
                    
                    company_name = item.get('organization', 'Unknown')
                    organization_url = item.get('organization_url')
                    
                    company, created = Company.objects.get_or_create(
                        name=company_name,
                        defaults={
                            'website': organization_url,
                        }
                    )
                    
                    if created or not company.logo_url:
                        logo_service.fetch_logo_for_company(company)

                    ScrapedJob.objects.create(
                        source=source,
                        title=item.get('title', 'Untitled'),
                        company=company,
                        company_text=company_name,
                        location=location,
                        url=job_url,
                        description=f"Job ID: {item.get('id')}. Source: {item.get('source')}",
                        is_remote=item.get('remote_derived', False),
                        posted_date=timezone.now().date(),
                        status='new'
                    )
                    count += 1
                    
                source.last_scraped = timezone.now()
                source.save()
                return count, None # Success!
                
            except Exception as e:
                logger.error(f"Error fetching from RapidAPI with key ...{api_key[-4:]}: {str(e)}")
                last_error = str(e)
                # If it's not a 429/401 handled above, maybe try next key?
                # For now, let's assume other errors might be transient or config specific
                break 

    return 0, f"All RapidAPI keys failed. Last error: {last_error}"

def fetch_openwebninja_jobs(limit=10, query="Developer", location="Chicago"):
    config = get_api_config('openwebninja')
    if not config:
        return 0, "Configuration not found"
        
    url = "https://api.openwebninja.com/jsearch/search"
    headers = {
        'x-api-key': config.api_key
    }
    
    # Construct query parameter
    if location:
        full_query = f"{query} jobs in {location}"
    else:
        full_query = query
    
    params = {
        'query': full_query,
        'num_pages': '1', # Basic param
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # OpenWebNinja (JSearch) typically returns { "data": [ ... ] }
        jobs_list = data.get('data', [])
        
        count = 0
        source, _ = ScraperSource.objects.get_or_create(
            name="OpenWebNinja - JSearch",
            defaults={'url': "https://openwebninja.com/"}
        )
        
        logo_service = LogoFetchService()
        
        for item in jobs_list:
            # Map fields
            job_title = item.get('job_title', 'Untitled')
            employer_name = item.get('employer_name', 'Unknown')
            job_city = item.get('job_city')
            job_country = item.get('job_country')
            location_val = f"{job_city}, {job_country}" if job_city and job_country else (job_city or job_country or "Unknown")
            
            job_url = item.get('job_apply_link') or item.get('job_google_link')
            
            if not job_url:
                continue
                
            if ScrapedJob.objects.filter(url=job_url).exists():
                continue
                
            # Company
            company_website = item.get('employer_website')
            company_logo = item.get('employer_logo')
            
            company, created = Company.objects.get_or_create(
                name=employer_name,
                defaults={'website': company_website}
            )
            
            if company_logo:
                if not company.logo_url:
                    company.logo_url = company_logo
                    company.save()
            elif created or not company.logo_url:
                logo_service.fetch_logo_for_company(company)
                
            ScrapedJob.objects.create(
                source=source,
                title=job_title,
                company=company,
                company_text=employer_name,
                location=location_val,
                url=job_url,
                description=item.get('job_description', 'No description provided.'),
                is_remote=item.get('job_is_remote', False),
                posted_date=timezone.now().date(),
                status='new',
                job_type=item.get('job_employment_type'),
                salary_range=f"{item.get('job_min_salary')}-{item.get('job_max_salary')} {item.get('job_salary_currency')}" if item.get('job_min_salary') else None
            )
            count += 1
            
            if count >= limit:
                break
                
        source.last_scraped = timezone.now()
        source.save()
        return count, None
        
    except Exception as e:
        logger.error(f"Error fetching from OpenWebNinja: {str(e)}")
        return 0, str(e)

def fetch_linkedin_jobs(limit=10, query="Data Engineer", location_filter='"United States" OR "United Kingdom"'):
    configs = get_api_configs('linkedin')
    if not configs.exists():
        return 0, "No active LinkedIn configuration found"
    
    # Query construction based on user cURL
    params = {
        'limit': str(limit),
        'offset': '0',
        'title_filter': f'"{query}"',
        'location_filter': location_filter,
        'description_type': 'text'
    }

    last_error = None
    
    for config in configs:
        api_key = config.api_key
        
        # Base URL from config or default - use the working /active-jb-24h endpoint
        if config.base_url and config.base_url.strip():
            url = config.base_url.strip()
            # If user entered just the domain root (common mistake), append the endpoint
            if url.endswith('rapidapi.com') or url.endswith('rapidapi.com/'):
                 if not url.endswith('/'):
                     url += '/'
                 url += 'active-jb-24h'
        else:
            url = "https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h"
        
        headers = {
            'x-rapidapi-host': "linkedin-job-search-api.p.rapidapi.com",
            'x-rapidapi-key': api_key
        }

        retries = 3
        for attempt in range(retries):
            try:
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code == 429:
                    logger.warning(f"Rate limit hit for LinkedIn key ending in ...{api_key[-4:]}. Retrying in {2**attempt}s...")
                    time.sleep(2 ** attempt)
                    continue
                
                if response.status_code == 401:
                    logger.warning(f"Unauthorized (401) for LinkedIn key ending in ...{api_key[-4:]}. Trying next key.")
                    last_error = "Unauthorized API Key"
                    break # Try next config
                
                response.raise_for_status()
                data = response.json()
                
                count = 0
                source, _ = ScraperSource.objects.get_or_create(
                    name="RapidAPI - LinkedIn Job Search",
                    defaults={'url': "https://rapidapi.com/linkedin-job-search-api"}
                )
                
                # Initialize logo service
                logo_service = LogoFetchService()

                for item in data:
                    job_url = item.get('url')
                    if not job_url:
                        continue
                        
                    # Check for duplicates
                    if ScrapedJob.objects.filter(url=job_url).exists():
                        continue

                    # Extract location
                    locations = item.get('locations_derived', [])
                    location = locations[0] if locations else item.get('location', "Unknown")
                    
                    # Get or create company
                    company_name = item.get('organization', 'Unknown')
                    organization_url = item.get('organization_url') or item.get('linkedin_org_url')
                    
                    company, created = Company.objects.get_or_create(
                        name=company_name,
                        defaults={
                            'website': organization_url,
                            'description': item.get('linkedin_org_description'),
                        }
                    )
                    
                    # Fetch logo for new companies or companies without logos
                    # LinkedIn API may provide logo URL directly
                    if item.get('organization_logo'):
                        if not company.logo_url:
                            company.logo_url = item.get('organization_logo')
                            company.save()
                    elif created or not company.logo_url:
                        logo_service.fetch_logo_for_company(company)

                    ScrapedJob.objects.create(
                        source=source,
                        title=item.get('title', 'Untitled'),
                        company=company,
                        company_text=company_name,
                        location=location,
                        url=job_url,
                        description=item.get('description', 'No description provided.'),
                        is_remote=item.get('remote_derived', False),
                        posted_date=timezone.now().date(), # Using current date as fallback
                        status='new'
                    )
                    count += 1
                    
                source.last_scraped = timezone.now()
                source.save()
                return count, None
                
            except Exception as e:
                logger.error(f"Error fetching from LinkedIn API with key ...{api_key[-4:]}: {str(e)}")
                last_error = str(e)
                break 

    return 0, f"All LinkedIn keys failed. Last error: {last_error}"

def fetch_serp_jobs(limit=20, query="Remote Developer"):
    config = get_api_config('serp')
    if not config:
        return 0, "Configuration not found"

    url = "https://serpapi.com/search.json"
    params = {
        'engine': 'google_jobs',
        'q': query,
        'api_key': config.api_key,
        'num': str(limit) # SERP API uses 'num' for limit
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        jobs_results = data.get('jobs_results', [])
        count = 0
        
        source, _ = ScraperSource.objects.get_or_create(
            name="SERP API - Google Jobs",
            defaults={'url': "https://serpapi.com/"}
        )
        
        # Initialize logo service
        logo_service = LogoFetchService()

        for item in jobs_results:
            # SERP API structure might vary, but usually has title, company_name, location, etc.
            job_id = item.get('job_id')
            
            # Construct a URL if not provided directly (Google Jobs often links to Google search)
            # But usually 'related_links' or 'apply_options' has the link.
            apply_options = item.get('apply_options', [])
            job_url = apply_options[0].get('link') if apply_options else f"https://google.com/search?q={job_id}"
            
            if ScrapedJob.objects.filter(url=job_url).exists():
                continue
            
            # Get or create company
            company_name = item.get('company_name', 'Unknown')
            
            company, created = Company.objects.get_or_create(
                name=company_name
            )
            
            # Fetch logo for new companies or companies without logos
            if created or not company.logo_url:
                logo_service.fetch_logo_for_company(company)

            ScrapedJob.objects.create(
                source=source,
                title=item.get('title', 'Untitled'),
                company=company,
                company_text=company_name,
                location=item.get('location', 'Unknown'),
                url=job_url,
                description=item.get('description', 'No description provided.'),
                is_remote='remote' in item.get('location', '').lower() or 'remote' in item.get('title', '').lower(),
                posted_date=timezone.now().date(),
                status='new'
            )
            count += 1

        source.last_scraped = timezone.now()
        source.save()
        return count, None

    except Exception as e:
        logger.error(f"Error fetching from SERP API: {str(e)}")
        return 0, str(e)

def fetch_google_custom_jobs(limit=10, query="Remote Developer", site=None, company_id=None):
    """
    Wrapper for Indigenous Scraper using Google Custom Search + Selenium/BS4
    Supports 'site' parameter for targeted scraping.
    """
    from .indigenous_scraper import run_indigenous_scraper_task
    try:
        # If site is provided, append it to the query
        if site:
            # Clean domain (remove http/www)
            from urllib.parse import urlparse
            domain = site
            if 'http' in site:
                 domain = urlparse(site).netloc
            domain = domain.replace('www.', '')
            
            # Use 'site:' operator to restrict search to this company's career page or main domain
            # We add "careers" or "jobs" to ensure we land on relevant pages
            query = f"site:{domain} {query}"
            
        return run_indigenous_scraper_task(query, limit, company_id=company_id)
    except Exception as e:
        logger.error(f"Error in Indigenous Scraper: {str(e)}")
        return 0, str(e)

def fetch_adzuna_jobs(limit=10, query="Developer", location=""):
    configs = get_api_configs('adzuna')
    if not configs.exists():
        return 0, "No active Adzuna configuration found"

    last_error = None

    for config in configs:
        app_id = config.extra_config.get('app_id') if config.extra_config else None
        if not app_id:
            logger.warning(f"Skipping Adzuna config {config.id}: Missing app_id in extra_config")
            continue
            
        # Default to US if not specified
        country = config.extra_config.get('country', 'us')
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
        
        params = {
            'app_id': app_id,
            'app_key': config.api_key,
            'results_per_page': str(limit),
            'what': query,
            'content-type': 'application/json'
        }
        
        if location:
            params['where'] = location

        try:
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 401:
                logger.warning(f"Unauthorized (401) for Adzuna key ...{config.api_key[-4:]}. Trying next key.")
                last_error = "Unauthorized API Key/App ID"
                continue
            
            if response.status_code == 429:
                logger.warning(f"Rate limit (429) for Adzuna key ...{config.api_key[-4:]}. Trying next key.")
                last_error = "Rate limit exceeded"
                continue

            response.raise_for_status()
            data = response.json()
            
            jobs_list = data.get('results', [])
            
            count = 0
            source, _ = ScraperSource.objects.get_or_create(
                name="Adzuna",
                defaults={'url': "https://www.adzuna.com/"}
            )
            
            logo_service = LogoFetchService()
            
            for item in jobs_list:
                job_url = item.get('redirect_url')
                if not job_url:
                    continue
                    
                if ScrapedJob.objects.filter(url=job_url).exists():
                    continue
                
                # Company
                company_data = item.get('company', {})
                company_name = company_data.get('display_name', 'Unknown')
                
                company, created = Company.objects.get_or_create(
                    name=company_name
                )
                
                if created or not company.logo_url:
                    logo_service.fetch_logo_for_company(company)
                
                # Location
                loc_data = item.get('location', {})
                location_val = loc_data.get('display_name', 'Unknown')
                
                # Salary
                salary_min = item.get('salary_min')
                salary_max = item.get('salary_max')
                salary_range = None
                if salary_min and salary_max:
                    salary_range = f"{salary_min}-{salary_max}"
                elif salary_min:
                    salary_range = f"{salary_min}+"
                
                ScrapedJob.objects.create(
                    source=source,
                    title=item.get('title', 'Untitled'),
                    company=company,
                    company_text=company_name,
                    location=location_val,
                    url=job_url,
                    description=item.get('description', 'No description provided.'),
                    is_remote=False, # Adzuna doesn't strictly say, but we can assume false or check description
                    posted_date=timezone.now().date(), # Adzuna provides 'created' timestamp, could parse
                    status='new',
                    job_type=item.get('contract_time'), # e.g. full_time
                    salary_range=salary_range
                )
                count += 1
                
                if count >= limit:
                    break
                    
            source.last_scraped = timezone.now()
            source.save()
            return count, None
            
        except Exception as e:
            logger.error(f"Error fetching from Adzuna: {str(e)}")
            last_error = str(e)
            continue

    return 0, f"All Adzuna keys failed. Last error: {last_error}"
