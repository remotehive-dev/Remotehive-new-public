
from pydantic import BaseModel, Field, field_validator
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
    tags: List[str] = Field(default_factory=list)
    type: Optional[str] = None
    locations: List[str] = Field(default_factory=list)

    @field_validator("tags", "locations", mode="before")
    @classmethod
    def _coerce_company_lists(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        return v

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
    requirements: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    status: str = 'active'

    @field_validator("requirements", "benefits", "tags", mode="before")
    @classmethod
    def _coerce_job_lists(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        return v

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
