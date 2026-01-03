
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Any
from app.services.supabase_service import get_supabase

router = APIRouter()

@router.get("/users")
def get_users(page: int = 1, per_page: int = 50):
    """
    List all users from Supabase Auth (Master Access).
    """
    try:
        supabase = get_supabase()
        # Supabase Admin API for listing users
        # Note: supabase-py's auth.admin.list_users returns a response object
        response = supabase.auth.admin.list_users(page=page, per_page=per_page)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
def get_user(user_id: str):
    try:
        supabase = get_supabase()
        response = supabase.auth.admin.get_user_by_id(user_id)
        if not response.user:
             raise HTTPException(status_code=404, detail="User not found")
        return response.user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    """
    Delete a user (Master Access).
    """
    try:
        supabase = get_supabase()
        response = supabase.auth.admin.delete_user(user_id)
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/users/{user_id}/ban")
def ban_user(user_id: str, ban_duration: str = "none"):
    """
    Ban a user.
    """
    try:
        supabase = get_supabase()
        response = supabase.auth.admin.update_user_by_id(
            user_id, 
            {"ban_duration": ban_duration}
        )
        return response.user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
