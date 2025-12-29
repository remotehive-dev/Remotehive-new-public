
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.supabase_service import supabase
from app.models.schemas import Company, Job, CompanyUpdate, JobUpdate

router = APIRouter()

# --- Companies ---

@router.get("/companies", response_model=List[Company])
def get_companies(skip: int = 0, limit: int = 100):
    """
    List all companies with pagination.
    Master access allows viewing all data.
    """
    response = supabase.table("companies").select("*").range(skip, skip + limit - 1).execute()
    return response.data

@router.get("/companies/{company_id}", response_model=Company)
def get_company(company_id: str):
    response = supabase.table("companies").select("*").eq("id", company_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Company not found")
    return response.data[0]

@router.patch("/companies/{company_id}", response_model=Company)
def update_company(company_id: str, company_in: CompanyUpdate):
    """
    Update company details (Master Access).
    """
    data = company_in.model_dump(exclude_unset=True)
    response = supabase.table("companies").update(data).eq("id", company_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Company not found")
    return response.data[0]

@router.delete("/companies/{company_id}")
def delete_company(company_id: str):
    """
    Hard delete a company.
    """
    response = supabase.table("companies").delete().eq("id", company_id).execute()
    return {"message": "Company deleted successfully", "data": response.data}

# --- Jobs ---

@router.get("/jobs", response_model=List[Job])
def get_jobs(skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """
    List all jobs. Optional status filter.
    """
    query = supabase.table("jobs").select("*")
    if status:
        query = query.eq("status", status)
    
    response = query.range(skip, skip + limit - 1).execute()
    return response.data

@router.patch("/jobs/{job_id}/status")
def update_job_status(job_id: str, status: str):
    """
    Approve/Reject/Close a job.
    """
    if status not in ['active', 'closed', 'draft', 'rejected']:
         raise HTTPException(status_code=400, detail="Invalid status")
         
    response = supabase.table("jobs").update({"status": status}).eq("id", job_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return response.data[0]
