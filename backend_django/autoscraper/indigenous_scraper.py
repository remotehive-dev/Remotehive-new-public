import logging
import time
import hashlib
from django.utils import timezone
from .models import ScrapedJob, ScraperSource, Company, CompanyScrapeProfile
from core.taxonomy_models import JobRole
from .discovery import DiscoveryEngine
from .logic_engine import LogicEngine
from .llm_helper import LLMScraperHelper
from .domain_validator import DomainSafetyValidator

logger = logging.getLogger(__name__)

class IndigenousScraperEngine:
    """
    Refactored Engine: Strictly Company-Centric Pipeline
    
    1. Discovery (Safe, Domain-Bound)
    2. Deduplication Check (Hash-based)
    3. Fetch & Extract (LogicEngine)
    4. Parse & Normalize (LLM)
    5. Save State
    """
    
    def __init__(self):
        self.logic_engine = LogicEngine()
        self.llm_helper = LLMScraperHelper()
        
    def run(self, company_id, job_roles=None, limit=10, strategies=None, api_configs=None, advanced_filters=None):
        # 1. Company Context
        try:
            company = Company.objects.get(id=company_id)
            # Ensure profile exists
            profile, _ = CompanyScrapeProfile.objects.get_or_create(company=company)
        except Company.DoesNotExist:
            logger.error(f"Engine Error: Company ID {company_id} not found.")
            return 0, "Company not found"

        logger.info(f"Starting Engine for: {company.name}")
        
        # 2. Discovery Phase
        discovery = DiscoveryEngine(profile)
        # Pass limit to discovery if strategy supports it (e.g. Google Search num_results)
        # Currently discover() returns ALL URLs found. We limit them here.
        safe_urls = discovery.discover(job_roles, strategies_override=strategies, api_configs=api_configs, advanced_filters=advanced_filters)
        
        # Limit discovery results
        if limit:
            safe_urls = safe_urls[:limit]
            
        logger.info(f"Discovered {len(safe_urls)} URLs to process.")
        
        count = 0
        source, _ = ScraperSource.objects.get_or_create(
            name="Indigenous Scraper (Safe Pipeline)",
            defaults={'url': "https://remotehive.io"}
        )
        
        jobs_found_count = 0
        errors = []
        
        for url in safe_urls:
            # 3. Deduplication Check (Early)
            if ScrapedJob.objects.filter(url=url).exists():
                logger.info(f"Skipping known URL: {url}")
                continue
                
            # 4. Fetch & Extract
            logger.info(f"Processing: {url}")
            
            # Double Check Safety
            if not DomainSafetyValidator.is_safe_url(url, profile):
                logger.warning(f"Safety Block: {url}")
                continue
                
            details = self.logic_engine.extract_details(url)
            
            if details.get('error'):
                logger.warning(f"Extraction failed: {details['error']}")
                errors.append(f"{url}: {details['error']}")
                continue
                
            # 5. LLM Parsing
            raw_text = details.get('description') or "No description"
            llm_data = self.llm_helper.parse_job_content(raw_text, company.name, url)
            
            # 6. Normalize Data
            title = llm_data.get('title') if llm_data else details.get('title')
            if not title:
                title = "Unknown Role"

            location = llm_data.get('location') if llm_data else "Remote"
            
            # Generate Dedup Hash
            raw_hash_str = f"{company.id}-{title.lower().strip()}-{location.lower().strip()}"
            dedup_hash = hashlib.sha256(raw_hash_str.encode('utf-8')).hexdigest()
            
            if ScrapedJob.objects.filter(dedup_hash=dedup_hash).exists():
                logger.info(f"Duplicate Content Hash: {title} at {location}")
                continue

            # Role Matching
            job_role = None
            role_name = llm_data.get('job_role') if llm_data else None
            if role_name:
                job_role = JobRole.objects.filter(name__iexact=role_name).first()

            # 7. Save State
            try:
                ScrapedJob.objects.create(
                    source=source,
                    title=title[:255],
                    company=company,
                    company_text=company.name,
                    location=location[:255],
                    url=url,
                    description=llm_data.get('description') or raw_text,
                    salary_range=llm_data.get('salary_range'),
                    job_type=llm_data.get('job_type'),
                    is_remote=llm_data.get('is_remote', True),
                    job_role=job_role,
                    apply_url=llm_data.get('direct_apply_link'),
                    experience=llm_data.get('experience_required'),
                    
                    # State Machine
                    scrape_status='parsed_partial' if not llm_data else 'discovered', 
                    status='new',
                    dedup_hash=dedup_hash,
                    last_attempt_at=timezone.now()
                )
                jobs_found_count += 1
                logger.info(f"Saved: {title}")
                
            except Exception as e:
                logger.error(f"Save Error: {e}")
                errors.append(str(e))
                
            # Polite Delay
            time.sleep(2)
            
        return jobs_found_count, errors

def run_indigenous_scraper_task(query, limit=10, company_id=None):
    """
    Legacy wrapper updated to use new Engine.
    'query' is largely ignored in favor of strict company discovery, 
    unless used for job_role matching.
    """
    if not company_id:
        return 0, "Company ID required for strict scraping."
        
    engine = IndigenousScraperEngine()
    # We can treat 'query' as a potential job role filter if it matches a role name?
    # For now, pass None for roles to discover all.
    return engine.run(company_id, limit=limit)
