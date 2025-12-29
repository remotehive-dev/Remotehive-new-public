
from fastapi import APIRouter
from app.api.endpoints import admin, users

api_router = APIRouter()
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(users.router, prefix="/admin", tags=["users"])
