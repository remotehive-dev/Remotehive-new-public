import requests
import logging

logger = logging.getLogger(__name__)

class GoogleCustomSearchScraper:
    """
    Client for Google Custom Search JSON API.
    Used for the 'Discovery' phase of the Indigenous Scraper.
    """
    BASE_URL = "https://www.googleapis.com/customsearch/v1"
    
    def __init__(self, api_key, cx):
        self.api_key = api_key
        self.cx = cx
        
    def search(self, query, num_results=10):
        """
        Search Google for job listings.
        Returns a list of dicts with 'title', 'link', 'snippet', 'pagemap'.
        """
        results = []
        start = 1
        
        # Max limit for free tier is usually 100 results per day (or paid), 
        # but per query pagination is 10 items.
        
        while len(results) < num_results:
            try:
                params = {
                    'key': self.api_key,
                    'cx': self.cx,
                    'q': query,
                    'start': start,
                    'num': min(10, num_results - len(results)) # Max 10 per request
                }
                
                logger.info(f"Searching Google Custom Search: {query} (start={start})")
                response = requests.get(self.BASE_URL, params=params, timeout=15)
                
                if response.status_code == 403:
                    logger.error("Google API Limit Exceeded or Invalid Key")
                    break
                    
                response.raise_for_status()
                data = response.json()
                
                items = data.get('items', [])
                if not items:
                    logger.info("No more items found.")
                    break
                    
                for item in items:
                    results.append({
                        'title': item.get('title'),
                        'link': item.get('link'),
                        'snippet': item.get('snippet'),
                        'pagemap': item.get('pagemap', {})
                    })
                    
                start += 10
                # Safety break to prevent infinite loops if something goes wrong
                if start > 100: 
                    break
                    
            except Exception as e:
                logger.error(f"Error in Google Custom Search: {e}")
                break
                
        return results
