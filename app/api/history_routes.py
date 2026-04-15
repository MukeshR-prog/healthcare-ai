from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.api.route_utils import build_history_item, history_lookup_pipeline
from app.db.connection import get_database
from app.schemas.history import HistoryDetailResponse, HistoryListResponse
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/history", response_model=HistoryListResponse)
def get_history(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        *history_lookup_pipeline(),
        {"$sort": {"created_at": -1}},
    ]
    claim_docs = list(db["claims"].aggregate(pipeline))
    items = [build_history_item(claim_doc) for claim_doc in claim_docs]
    return HistoryListResponse(total=len(items), items=items)


@router.get("/history/{id}", response_model=HistoryDetailResponse)
def get_history_by_id(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid claim id")

    pipeline = [
        {"$match": {"_id": ObjectId(id), "user_id": current_user["id"]}},
        *history_lookup_pipeline(),
    ]
    claim_doc = next(db["claims"].aggregate(pipeline), None)
    if not claim_doc:
        raise HTTPException(status_code=404, detail="Claim not found")

    return HistoryDetailResponse(item=build_history_item(claim_doc))
