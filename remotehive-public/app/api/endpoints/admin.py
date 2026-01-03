
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.supabase_service import get_supabase
from app.models.schemas import Company, Job, CompanyUpdate, JobUpdate

router = APIRouter()

# --- Companies ---

@router.get("/companies", response_model=List[Company])
def get_companies(skip: int = 0, limit: int = 100):
    """
    List all companies with pagination.
    Master access allows viewing all data.
    """
    try:
        supabase = get_supabase()
        response = supabase.table("companies").select("*").range(skip, skip + limit - 1).execute()
        data = getattr(response, "data", None)
        if data is None:
            raise HTTPException(status_code=502, detail="Database query failed")
        return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Database query failed")

@router.get("/companies/{company_id}", response_model=Company)
def get_company(company_id: str):
    try:
        supabase = get_supabase()
        response = supabase.table("companies").select("*").eq("id", company_id).execute()
        data = getattr(response, "data", None)
        if not data:
            raise HTTPException(status_code=404, detail="Company not found")
        return data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Database query failed")

@router.patch("/companies/{company_id}", response_model=Company)
def update_company(company_id: str, company_in: CompanyUpdate):
    """
    Update company details (Master Access).
    """
    try:
        supabase = get_supabase()
        data = company_in.model_dump(exclude_unset=True)
        response = supabase.table("companies").update(data).eq("id", company_id).execute()
        res_data = getattr(response, "data", None)
        if not res_data:
            raise HTTPException(status_code=404, detail="Company not found")
        return res_data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Database query failed")

@router.delete("/companies/{company_id}")
def delete_company(company_id: str):
    """
    Hard delete a company.
    """
    try:
        supabase = get_supabase()
        response = supabase.table("companies").delete().eq("id", company_id).execute()
        data = getattr(response, "data", None)
        if data is None:
            raise HTTPException(status_code=502, detail="Database query failed")
        return {"message": "Company deleted successfully", "data": data}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Database query failed")

# --- Jobs ---

@router.get("/jobs", response_model=List[Job])
def get_jobs(skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """
    List all jobs. Optional status filter.
    """
    try:
        supabase = get_supabase()
        query = supabase.table("jobs").select("*")
        if status:
            query = query.eq("status", status)
        response = query.range(skip, skip + limit - 1).execute()
        data = getattr(response, "data", None)
        if data is None:
            raise HTTPException(status_code=502, detail="Database query failed")
        return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Database query failed")

@router.patch("/jobs/{job_id}/status")
def update_job_status(job_id: str, status: str):
    """
    Approve/Reject/Close a job.
    """
    if status not in ['active', 'closed', 'draft', 'rejected']:
         raise HTTPException(status_code=400, detail="Invalid status")

    try:
        supabase = get_supabase()
        response = supabase.table("jobs").update({"status": status}).eq("id", job_id).execute()
        data = getattr(response, "data", None)
        if not data:
            raise HTTPException(status_code=404, detail="Job not found")
        return data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Database query failed")
