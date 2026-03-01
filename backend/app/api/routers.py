from fastapi import APIRouter
from app.api.jobs import router as jobs_router
from app.api.system import router as system_router

router = APIRouter()

router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
router.include_router(system_router, prefix="/system", tags=["system"])