
import logging
import time
import random
import re
import ssl
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup

# Fix SSL certificate errors on macOS
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Try to import undetected_chromedriver, fallback to standard selenium
try:
    import undetected_chromedriver as uc
    USE_UC = True
    HAS_SELENIUM = True
except ImportError:
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.options import Options
        USE_UC = False
        HAS_SELENIUM = True
    except ImportError:
        USE_UC = False
        HAS_SELENIUM = False

if HAS_SELENIUM:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

logger = logging.getLogger(__name__)

class LogicEngine:
    """
    Advanced Logic Engine for bypassing security and extracting job details.
    Uses Selenium/Undetected Chromedriver to render JS-heavy pages,
    with a fallback to requests/BeautifulSoup.
    """
    
    def __init__(self, headless=True):
        self.headless = headless
        self.driver = None

    def _setup_driver(self):
        """Initialize the browser driver with stealth settings"""
        if not HAS_SELENIUM:
            raise ImportError("Selenium is not installed")

        try:
            # Try UC first if enabled
            if USE_UC:
                try:
                    options = uc.ChromeOptions()
                    if self.headless:
                        options.add_argument('--headless=new')
                    options.add_argument('--no-sandbox')
                    options.add_argument('--disable-dev-shm-usage')
                    
                    self.driver = uc.Chrome(options=options, version_main=None)
                    self.driver.set_page_load_timeout(30)
                    return
                except Exception as e:
                    logger.warning(f"Undetected Chromedriver failed, falling back to standard Selenium: {e}")
            
            # Standard Selenium Fallback
            options = Options()
            if self.headless:
                options.add_argument('--headless=new')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # Explicitly install driver with SSL fix
            # Verify SSL context is applied
            import os
            os.environ['WDM_SSL_VERIFY'] = '0'
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            
            self.driver.set_page_load_timeout(30)
            
        except Exception as e:
            logger.error(f"Failed to setup driver: {e}")
            raise

    def _teardown_driver(self):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

    def extract_details(self, url):
        """
        Main method to visit URL and extract details.
        Returns dict with description, salary, job_type, logo_url, etc.
        """
        data = {
            'description': None,
            'salary_range': None,
            'job_type': None,
            'company_logo': None,
            'error': None
        }
        
        # Strategy 1: Try Requests (Faster, simpler)
        try:
            data = self._simple_extract(url)
            if data['description'] and len(data['description']) > 200:
                logger.info(f"Simple extraction successful for {url}")
                return data
        except Exception as e:
            logger.warning(f"Simple extraction failed for {url}: {e}")

        # Strategy 2: Try Selenium (Slower, handles JS)
        if HAS_SELENIUM:
            try:
                self._setup_driver()
                logger.info(f"Logic Engine (Selenium) visiting: {url}")
                
                self.driver.get(url)
                
                # Wait for body to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Allow some JS execution time
                time.sleep(random.uniform(2, 4))
                
                # Get page source
                page_source = self.driver.page_source
                soup = BeautifulSoup(page_source, 'html.parser')
                
                self._process_soup(soup, data, url)

            except Exception as e:
                logger.error(f"Logic Engine (Selenium) Error on {url}: {e}")
                data['error'] = str(e)
            finally:
                self._teardown_driver()
        else:
            logger.warning("Selenium not available, skipping advanced extraction.")
            if not data['error']:
                data['error'] = "Selenium not installed and simple extraction failed."
            
        return data

    def _simple_extract(self, url):
        """Fallback extraction using requests"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        data = {
            'description': None,
            'salary_range': None,
            'job_type': None,
            'company_logo': None,
            'error': None
        }
        self._process_soup(soup, data, url)
        return data

    def _process_soup(self, soup, data, url):
        """Common processing logic for BeautifulSoup object"""
        # 1. Clean up
        for script in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
            script.decompose()
            
        # 2. Extract Description
        description_container = self._find_description_container(soup)
        
        if description_container:
            data['description'] = str(description_container)
        else:
            # Fallback: Just get text
            text = soup.get_text(separator='\n', strip=True)
            if len(text) > 200:
                data['description'] = text
        
        # 3. Extract Salary
        text_content = soup.get_text(separator=' ', strip=True)
        data['salary_range'] = self._extract_salary(text_content)
        
        # 4. Extract Job Type
        data['job_type'] = self._extract_job_type(text_content)
        
        # 5. Extract Logo
        data['company_logo'] = self._extract_logo(soup, url)

    def _find_description_container(self, soup):
        # 1. Try common selectors
        selectors = [
            'div[class*="description"]', 'div[id*="description"]',
            'section[class*="description"]', 'section[id*="description"]',
            'div[class*="details"]', 'div[class*="content"]',
            'article'
        ]
        
        candidates = []
        for sel in selectors:
            found = soup.select(sel)
            candidates.extend(found)
            
        if not candidates:
            # Try all divs
            candidates = soup.find_all('div')
            
        # Filter candidates that are too short
        candidates = [c for c in candidates if len(c.get_text(strip=True)) > 50]
        
        if not candidates:
            return None
            
        # Return the one with the most text
        best = max(candidates, key=lambda t: len(t.get_text(strip=True)))
        return best

    def _extract_salary(self, text):
        # Patterns: $120k - $140k, $100,000 - $150,000, $50/hr
        salary_pattern = re.compile(r'\$[\d,]+(?:k)?\s*-\s*\$[\d,]+(?:k)?(?:\/yr|\/mo|\/hr)?', re.I)
        match = salary_pattern.search(text)
        if match:
            return match.group(0)
        return None

    def _extract_job_type(self, text):
        type_keywords = {
            'full_time': ['full time', 'full-time'],
            'part_time': ['part time', 'part-time'],
            'contract': ['contract', 'contractor'],
            'internship': ['intern', 'internship']
        }
        
        lower_text = text.lower()
        for type_key, keywords in type_keywords.items():
            if any(k in lower_text for k in keywords):
                return type_key
        return None

    def _extract_logo(self, soup, url):
        # Try to find logo in meta tags
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            return og_image["content"]
            
        # Try to find img with logo in src or alt
        images = soup.find_all("img")
        for img in images:
            src = img.get("src", "")
            alt = img.get("alt", "").lower()
            if "logo" in src.lower() or "logo" in alt:
                if src.startswith("//"):
                    return "https:" + src
                if src.startswith("/"):
                    parsed = urlparse(url)
                    return f"{parsed.scheme}://{parsed.netloc}{src}"
                if src.startswith("http"):
                    return src
        return None

# Helper function for easy import
def run_logic_engine(url):
    engine = LogicEngine()
    return engine.extract_details(url)
