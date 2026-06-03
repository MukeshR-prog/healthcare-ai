from fastapi import APIRouter

from app.api.analytics_routes import router as analytics_router
from app.api.auth_routes import router as auth_router
from app.api.claim_routes import router as claim_router
from app.api.history_routes import router as history_router
from app.api.alert_routes import router as alert_router
from app.api.investigation_routes import router as investigation_router
from app.api.audit_routes import router as audit_router
from app.api.provider_routes import router as provider_router
from app.api.document_routes import router as document_router
from app.api.explainability_routes import router as explainability_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(claim_router)
router.include_router(analytics_router)
router.include_router(history_router)
router.include_router(alert_router)
router.include_router(investigation_router)
router.include_router(audit_router)
router.include_router(provider_router)
router.include_router(document_router)
router.include_router(explainability_router)