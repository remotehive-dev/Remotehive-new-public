import logging
from .logic_engine import run_logic_engine

logger = logging.getLogger(__name__)

def extract_job_details(url):
    """
    Visits the URL and attempts to extract details using the Logic Engine (Selenium).
    """
    try:
        # Use the robust Logic Engine
        data = run_logic_engine(url)
        return data
    except Exception as e:
        logger.error(f"Logic Engine failed for {url}: {e}")
        return {
            'description': None,
            'salary_range': None,
            'job_type': None,
            'error': str(e)
        }
        
    return data
