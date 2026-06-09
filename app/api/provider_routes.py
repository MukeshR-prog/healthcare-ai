# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.db.connection import get_database
from app.services.auth_service import get_current_user, require_roles
from app.schemas.provider import (
    ProviderResponse,
    ProviderMetricsResponse,
    ProviderDetailResponse,
    ProviderFlagUpdate,
    ProviderWatchlistUpdate,
    ProviderComparisonRequest
)
from app.repositories.provider_repository import ProviderRepository
from app.services.provider_service import ProviderService


router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("", response_model=list[ProviderMetricsResponse])
def get_providers_endpoint(
    search: str = Query(None),
    watchlisted: bool = Query(None),
    risk_level: str = Query(None, alias="riskLevel"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    sort_by: str = Query("riskScore"),
    sort_dir: int = Query(-1),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    ProviderService.sync_providers(db)
    _, items = ProviderRepository.get_providers(
        db,
        search=search,
        watchlisted=watchlisted,
        risk_level=risk_level,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    return items


@router.get("/leaderboard", response_model=list[ProviderMetricsResponse])
def get_leaderboard_endpoint(
    limit: int = Query(10, ge=1),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    ProviderService.sync_providers(db)
    return ProviderRepository.get_leaderboard(db, limit=limit)


@router.get("/metrics")
def get_metrics_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return ProviderService.get_kpi_metrics(db)


@router.get("/trends")
def get_trends_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return ProviderService.get_trends(db)


@router.get("/{id}", response_model=ProviderDetailResponse)
def get_provider_detail_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    provider = ProviderService.get_provider_detail(db, id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.patch("/{id}/watchlist", response_model=ProviderResponse)
def update_watchlist_endpoint(
    id: str,
    payload: ProviderWatchlistUpdate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(require_roles(["Analyst", "Senior Analyst", "Admin"]))
):
    provider = ProviderService.update_watchlist(db, id, payload.watchlist, current_user["email"])
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.patch("/{id}/flag", response_model=ProviderResponse)
def update_flag_endpoint(
    id: str,
    payload: ProviderFlagUpdate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(require_roles(["Analyst", "Senior Analyst", "Admin"]))
):
    provider = ProviderService.update_flag(db, id, payload.flag, current_user["email"])
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.post("/compare", response_model=list[ProviderMetricsResponse])
def compare_providers_endpoint(
    payload: ProviderComparisonRequest,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    ProviderService.sync_providers(db)
    return ProviderRepository.compare_providers(db, payload.names)
