from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.db.connection import get_database
from app.services.auth_service import get_current_user, require_roles
from app.schemas.explainability import (
    ExplanationResponse,
    FeatureContributionResponse,
    PredictionInsightResponse,
    ExplainabilityMetricsResponse
)
from app.repositories.explainability_repository import ExplainabilityRepository
from app.services.explainability_service import ExplainabilityService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/explanations", tags=["explainability"])

# Dependency for roles
auth_dependency = Depends(require_roles(["Analyst", "Senior Analyst", "Admin"]))


@router.post("/sync", status_code=status.HTTP_200_OK)
def sync_explanations_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = auth_dependency
):
    synced_count = ExplainabilityService.sync_explainability_data(
        db=db,
        operator_email=current_user.get("email", "system")
    )
    return {"success": True, "synced_count": synced_count}


@router.get("", response_model=list[ExplanationResponse])
def get_explanations_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Database = Depends(get_database),
    current_user: dict = auth_dependency
):
    # Ensure auto-sync discovers predictions
    ExplainabilityService.sync_explainability_data(
        db=db,
        operator_email=current_user.get("email", "system")
    )
    items = ExplainabilityRepository.get_explanations(db, skip=skip, limit=limit)
    return items


@router.get("/metrics", response_model=ExplainabilityMetricsResponse)
def get_metrics_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = auth_dependency
):
    # Auto-sync data to ensure metrics reflect database state
    ExplainabilityService.sync_explainability_data(
        db=db,
        operator_email=current_user.get("email", "system")
    )
    metrics = ExplainabilityRepository.get_metrics(db)
    return metrics


@router.get("/{prediction_id}", response_model=ExplanationResponse)
def get_explanation_endpoint(
    prediction_id: str,
    db: Database = Depends(get_database),
    current_user: dict = auth_dependency
):
    explanation = ExplainabilityRepository.get_explanation(db, prediction_id)
    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Explanation not found."
        )
        
    # Log Risk Analysis Performed Event
    AuditService.log_event(
        db=db,
        event_type="RISK_ANALYSIS_PERFORMED",
        entity_type="EXPLANATION",
        entity_id=prediction_id,
        action="READ",
        description=f"Risk analysis and SHAP weights loaded for prediction {prediction_id}.",
        performed_by=current_user.get("email", "system")
    )
    return explanation


@router.get("/{prediction_id}/features", response_model=list[FeatureContributionResponse])
def get_feature_contributions_endpoint(
    prediction_id: str,
    db: Database = Depends(get_database),
    current_user: dict = auth_dependency
):
    # Log Insight Viewed Event
    AuditService.log_event(
        db=db,
        event_type="INSIGHT_VIEWED",
        entity_type="EXPLANATION",
        entity_id=prediction_id,
        action="READ",
        description=f"SHAP feature contributions list viewed for prediction {prediction_id}.",
        performed_by=current_user.get("email", "system")
    )
    features = ExplainabilityRepository.get_feature_contributions(db, prediction_id)
    return features


@router.get("/{prediction_id}/insights", response_model=PredictionInsightResponse)
def get_prediction_insights_endpoint(
    prediction_id: str,
    db: Database = Depends(get_database),
    current_user: dict = auth_dependency
):
    insight = ExplainabilityRepository.get_prediction_insights(db, prediction_id)
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction insights not found."
        )
    return insight
