from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.supabase_service import get_supabase

router = APIRouter()

# --- Response Models ---

class HomeStats(BaseModel):
    active_jobs: str = "10k+"
    companies: str = "2.5k"
    success_rate: str = "95%"
    countries: str = "50+"

class HomeHero(BaseModel):
    title: str = "Find Your Dream Remote Job"
    subtitle: str = "Connect with top companies offering remote opportunities worldwide."
    search_placeholder: str = "Job title or keyword"

class FooterLink(BaseModel):
    label: str
    url: str

class FooterConfig(BaseModel):
    description: str = "Connecting talented professionals with remote opportunities worldwide."
    email: str = "support@remotehive.in"
    phone: str = "+91-9667791765"
    address: str = "San Francisco, CA"
    copyright: str = "RemoteHive. All rights reserved."
    links: Dict[str, List[FooterLink]]

class RoleConfig(BaseModel):
    label: str
    value: str
    icon: str

class RegionConfig(BaseModel):
    label: str
    value: str
    icon: str
    count: int = 0

class HomeConfigResponse(BaseModel):
    stats: HomeStats
    hero: HomeHero
    footer: FooterConfig
    roles: List[RoleConfig]
    regions: List[RegionConfig]

class SEOTag(BaseModel):
    name: str
    content: str
    location: str

class SEOPageConfig(BaseModel):
    title: str
    description: str
    keywords: Optional[str] = None
    og_image: Optional[str] = None
    canonical_url: Optional[str] = None
    no_index: bool = False

class MarketingIntegration(BaseModel):
    name: str
    provider: str
    pixel_id: Optional[str] = None
    script_content: Optional[str] = None

class SEOConfigResponse(BaseModel):
    global_tags: List[SEOTag]
    pages: Dict[str, SEOPageConfig]
    marketing: List[MarketingIntegration]

class CompanyCategorySub(BaseModel):
    id: int
    name: str
    slug: str
    count: int

class CompanyCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None
    count: int
    sample_logos: List[str] = []
    subcategories: List[CompanyCategorySub]

# --- Endpoints ---

@router.get("/home-config", response_model=HomeConfigResponse)
def get_home_config():
    """
    Returns configuration for the Home Page.
    Currently returns static defaults as the DB migration to Supabase for config is pending.
    """
    # TODO: Fetch from Supabase when 'home_page_configuration' table is migrated/synced
    
    return {
        "stats": {
            "active_jobs": "10k+",
            "companies": "2.5k",
            "success_rate": "95%",
            "countries": "50+"
        },
        "hero": {
            "title": "Find Your Dream Remote Job",
            "subtitle": "Connect with top companies offering remote opportunities worldwide.",
            "search_placeholder": "Job title or keyword"
        },
        "footer": {
            "description": "Connecting talented professionals with remote opportunities worldwide.",
            "email": "support@remotehive.in",
            "phone": "+91-9667791765",
            "address": "San Francisco, CA",
            "copyright": "RemoteHive. All rights reserved.",
            "links": {
                "platform": [
                    {"label": "Browse Jobs", "url": "/jobs"},
                    {"label": "Browse Companies", "url": "/companies"},
                    {"label": "Pricing", "url": "/pricing"}
                ],
                "support": [
                    {"label": "Help Center", "url": "/help"},
                    {"label": "Contact Us", "url": "/contact"},
                    {"label": "Terms of Service", "url": "/terms"}
                ],
                "legal": [],
                "social": []
            }
        },
        "roles": [
            {"label": "Engineering", "value": "Engineering", "icon": "Code2"},
            {"label": "Design", "value": "Design", "icon": "Laptop"},
            {"label": "Marketing", "value": "Marketing", "icon": "Rocket"},
            {"label": "Product", "value": "Product", "icon": "Briefcase"},
            {"label": "Sales", "value": "Sales", "icon": "Globe"}
        ],
        "regions": [
            {"label": "Worldwide", "value": "remote", "icon": "🌍", "count": 1250},
            {"label": "United States", "value": "United States", "icon": "🇺🇸", "count": 850},
            {"label": "United Kingdom", "value": "United Kingdom", "icon": "🇬🇧", "count": 320},
            {"label": "Europe", "value": "Europe", "icon": "🇪🇺", "count": 540},
            {"label": "APAC & India", "value": "India", "icon": "🌏", "count": 410}
        ]
    }

@router.get("/seo-config", response_model=SEOConfigResponse)
def get_seo_config():
    """
    Returns SEO configuration.
    Currently returns defaults.
    """
    return {
        "global_tags": [],
        "pages": {
            "/": {
                "title": "RemoteHive - Find Remote Jobs",
                "description": "The best place to find remote jobs.",
                "keywords": "remote jobs, work from home"
            }
        },
        "marketing": []
    }

@router.get("/company-categories", response_model=List[CompanyCategoryResponse])
def get_company_categories():
    """
    Returns company categories.
    """
    # Placeholder
    return []
