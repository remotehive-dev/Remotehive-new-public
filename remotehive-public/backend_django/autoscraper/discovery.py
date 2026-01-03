import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from .domain_validator import DomainSafetyValidator
from .google_search import GoogleCustomSearchScraper
from core.models import APIConfiguration

logger = logging.getLogger(__name__)

class DiscoveryEngine:
    """
    Implements the Discovery Interface:
    discover(company, job_roles) -> List[JobURL]
    
    Strategies:
    1. Career Page Crawl (Internal Links Only)
    2. Google Site Search (site:domain.com)
    3. Sitemap (TODO)
    """
    
    def __init__(self, profile):
        self.profile = profile
        self.company = profile.company
        
    def discover(self, job_roles=None, strategies_override=None, api_configs=None, advanced_filters=None):
        """
        Main entry point. Dispatches to strategies based on profile or override.
        """
        discovered_urls = []
        
        # Determine strategies to use
        if strategies_override and isinstance(strategies_override, list):
            strategies = strategies_override
        else:
            # Default to single strategy from profile if no override
            strategies = [self.profile.discovery_strategy]
            
        logger.info(f"Discovery started for {self.company.name} using strategies: {strategies}")
        
        # Use set to avoid duplicates across strategies
        raw_urls = set()
        
        for strategy in strategies:
            current_urls = []
            if strategy == 'google_site_search':
                current_urls = self._discover_via_google(job_roles, api_configs, advanced_filters)
            elif strategy == 'career_page_crawl':
                current_urls = self._discover_via_crawl()
            elif strategy == 'ats_direct':
                if self.profile.ats_root_url:
                    current_urls = self._discover_via_crawl(start_url=self.profile.ats_root_url)
            
            # Add to set
            for url in current_urls:
                raw_urls.add(url)
        
        # Convert back to list for validation
        discovered_urls = list(raw_urls)
        
        # Final Safety Filter
        safe_urls = DomainSafetyValidator.validate_discovery_results(discovered_urls, self.profile)
        logger.info(f"Discovery complete. Found {len(safe_urls)} safe URLs out of {len(discovered_urls)} raw.")
        
        return safe_urls

    def _discover_via_google(self, job_roles, api_configs=None, advanced_filters=None):
        """
        Google Custom Search with site:domain operator.
        Uses provided api_configs (IDs) if available, otherwise defaults to active 'google_custom'.
        """
        try:
            # Determine which API Config(s) to use
            configs_to_use = []
            if api_configs and len(api_configs) > 0:
                # Filter active configs by ID and service_name
                configs_to_use = APIConfiguration.objects.filter(
                    id__in=api_configs, 
                    is_active=True, 
                    service_name='google_custom'
                )
            
            # If no specific configs selected or none matched, fallback to default active
            if not configs_to_use:
                configs_to_use = APIConfiguration.objects.filter(service_name='google_custom', is_active=True)
                
            if not configs_to_use.exists():
                logger.error("No active Google Custom Search API Configuration found.")
                return []
            
            # Aggregate results from ALL selected configs (Rotation or Parallel?)
            all_urls = set()
            
            for config in configs_to_use:
                try:
                    api_key = config.api_key
                    cx = config.extra_config.get('cx')
                    
                    if not cx:
                        continue
                        
                    searcher = GoogleCustomSearchScraper(api_key, cx)
                    
                    # Construct Queries
                    queries = []
                    
                    # A. Advanced Filter Logic (If Present)
                    if advanced_filters and (advanced_filters.get('roles') or advanced_filters.get('locations') or advanced_filters.get('experience') or advanced_filters.get('exclude')):
                        # Build complex query string
                        # Base: site:domain.com
                        parts = [f"site:{self.company.domain}"]
                        
                        # 1. Roles: (Role1 OR Role2)
                        roles = advanced_filters.get('roles', [])
                        if roles:
                            role_str = " OR ".join([f'"{r}"' for r in roles])
                            parts.append(f"({role_str})")
                        elif job_roles: # Fallback to standard roles if not in advanced but passed in arg
                             role_str = " OR ".join([f'"{r.name}"' for r in job_roles])
                             parts.append(f"({role_str})")
                        else:
                            parts.append("jobs") # Fallback keyword

                        # 2. Locations: (Loc1 OR Loc2)
                        locs = advanced_filters.get('locations', [])
                        logic_loc = advanced_filters.get('logic_loc', 'AND')
                        if locs:
                            loc_str = " OR ".join([f'"{l}"' for l in locs])
                            # If logic is OR, it's tricky with roles (Role OR Location?? No, usually Role AND Location)
                            # The UI shows "Role ... [AND/OR] Location".
                            # Google Search implies AND by default for space separated terms.
                            # OR must be explicit.
                            # If user selected OR between Role and Location: (RoleQuery) OR (LocationQuery)
                            # But usually we want (Role) AND (Location).
                            # Let's assume the UI logic_loc applies to the relationship between the previous block and this block.
                            
                            if logic_loc == 'OR':
                                # This is hard in a single query string if we already have site:domain
                                # site:domain (RoleQuery OR LocationQuery)
                                # We need to restructure.
                                # Let's keep it simple: We append it. 
                                # If logic is OR, we might need multiple queries or use OR operator carefully.
                                # Google: term1 OR term2
                                # site:abc.com (Role) OR (Location) -> This finds pages with Role OR pages with Location on the site.
                                parts.append("OR")
                                parts.append(f"({loc_str})")
                            else:
                                # AND (Default)
                                parts.append(f"({loc_str})")

                        # 3. Experience
                        exp = advanced_filters.get('experience')
                        logic_exp = advanced_filters.get('logic_exp', 'AND')
                        if exp:
                            if logic_exp == 'OR':
                                parts.append("OR")
                            parts.append(f'"{exp}"')

                        # 4. Exclude (NOT)
                        exclude = advanced_filters.get('exclude')
                        if exclude:
                            # Split by comma
                            ex_terms = [t.strip() for t in exclude.split(',')]
                            for term in ex_terms:
                                if term:
                                    parts.append(f'-"{term}"')

                        # Combine
                        query = " ".join(parts)
                        queries.append(query)

                    # B. Standard Logic (Fallback)
                    else:
                        # 1. Generic Search
                        queries.append(f"site:{self.company.domain} careers jobs")
                        
                        # 2. Role Specific Search (if roles provided)
                        if job_roles:
                            for role in job_roles:
                                queries.append(f"site:{self.company.domain} {role.name}")

                    # Execute Queries
                    for q in queries:
                        logger.info(f"Executing Google Query: {q}")
                        results = searcher.search(q, num_results=10)
                        for res in results:
                            all_urls.add(res['link'])
                        
                    if all_urls:
                        break
                        
                except Exception as ex:
                    logger.error(f"Google Search failed with config {config.name}: {ex}")
                    continue
            
            return list(all_urls)
            
        except Exception as e:
            logger.error(f"Google Discovery Error: {e}")
            return []

    def _discover_via_crawl(self, start_url=None):
        """
        Simple 1-level crawler for career pages.
        Strictly stays within domain.
        """
        if not start_url:
            # Guess career page if not provided
            # Try /careers, /jobs, /work-with-us
            candidates = [
                f"https://{self.company.domain}/careers",
                f"https://{self.company.domain}/jobs",
                f"https://{self.company.domain}/about/careers"
            ]
        else:
            candidates = [start_url]
            
        found_urls = set()
        visited = set()
        
        headers = {'User-Agent': 'RemoteHive-Bot/1.0'}
        
        for url in candidates:
            if url in visited: continue
            
            try:
                # 1. Validate before fetch
                if not DomainSafetyValidator.is_safe_url(url, self.profile):
                    continue
                    
                visited.add(url)
                logger.info(f"Crawling: {url}")
                
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code != 200:
                    continue
                    
                soup = BeautifulSoup(resp.content, 'html.parser')
                
                # Extract all links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    full_url = urljoin(url, href)
                    
                    # 2. Validate extracted link
                    if DomainSafetyValidator.is_safe_url(full_url, self.profile):
                        # Naive Heuristic: Keep if it looks like a job post
                        # e.g. /jobs/123, /careers/role-name
                        # For now, we collect all safe links and let the extractor decide?
                        # Or we filter? Let's collect safe links.
                        found_urls.add(full_url)
                        
            except Exception as e:
                logger.error(f"Crawl Error {url}: {e}")
                
        return list(found_urls)
