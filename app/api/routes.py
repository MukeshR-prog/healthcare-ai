from fastapi import APIRouter

from app.api.analytics_routes import router as analytics_router
from app.api.auth_routes import router as auth_router
from app.api.claim_routes import router as claim_router
from app.api.history_routes import router as history_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(claim_router)
router.include_router(analytics_router)
router.include_router(history_router)