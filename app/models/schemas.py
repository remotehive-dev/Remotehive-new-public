
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID

# Shared properties
class CompanyBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    tags: List[str] = []
    type: Optional[str] = None
    locations: List[str] = []

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None
    slug: Optional[str] = None

class Company(CompanyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Job Models
class JobBase(BaseModel):
    title: str
    slug: str
    location: str
    type: Optional[str] = None
    salary_range: Optional[str] = None
    description: Optional[str] = None
    requirements: List[str] = []
    benefits: List[str] = []
    tags: List[str] = []
    status: str = 'active'

class JobUpdate(JobBase):
    title: Optional[str] = None
    slug: Optional[str] = None
    location: Optional[str] = None

class Job(JobBase):
    id: UUID
    company_id: UUID
    posted_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
