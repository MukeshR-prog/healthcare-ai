from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.db.connection import get_database
from app.services.auth_service import get_current_user
from app.schemas.document import (
    UnifiedDocumentResponse,
    OCRExtractionResponse,
    VerificationResponse,
    DocumentNoteCreate,
    VerificationMetricsResponse
)
from app.services.document_service import DocumentService
from app.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=UnifiedDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_endpoint(
    file: UploadFile = File(...),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    valid_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPEG, and PNG files are accepted."
        )
    
    file_content = await file.read()
    if len(file_content) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 15 MB limit."
        )

    doc = DocumentService.upload_document(
        db=db,
        file_name=file.filename,
        file_content=file_content,
        file_type=file.content_type,
        operator_email=current_user.get("email", "system")
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload and process document."
        )
    return doc


@router.get("", response_model=list[UnifiedDocumentResponse])
def get_documents_endpoint(
    search: str = Query(None),
    status: str = Query(None),
    risk_level: str = Query(None, alias="riskLevel"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    sort_by: str = Query("created_at", alias="sortBy"),
    sort_dir: int = Query(-1, alias="sortDir"),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    DocumentService.sync_mock_documents(db)
    _, items = DocumentRepository.get_documents(
        db=db,
        search=search,
        status=status,
        risk_level=risk_level,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    return items


@router.get("/metrics", response_model=VerificationMetricsResponse)
def get_metrics_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    DocumentService.sync_mock_documents(db)
    
    total = db["documents"].count_documents({})
    if total == 0:
        return {"total": 0, "verified": 0, "flagged": 0, "accuracy": 0.0}
        
    verified = db["documents"].count_documents({"status": "Verified"})
    flagged = db["documents"].count_documents({"status": {"$in": ["Warning", "Mismatch"]}})
    
    pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$verification_score"}}}
    ]
    avg_res = list(db["verification_results"].aggregate(pipeline))
    accuracy = avg_res[0]["avg_score"] if avg_res else 0.0
    
    return {
        "total": total,
        "verified": verified,
        "flagged": flagged,
        "accuracy": accuracy
    }


@router.get("/{id}", response_model=UnifiedDocumentResponse)
def get_document_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    DocumentService.sync_mock_documents(db)
    doc = DocumentRepository.get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    return doc


@router.get("/{id}/ocr", response_model=OCRExtractionResponse)
def get_document_ocr_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    DocumentService.sync_mock_documents(db)
    ocr = db["ocr_extractions"].find_one({"document_id": id})
    if not ocr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OCR extraction details not found."
        )
    return ocr


@router.get("/{id}/verification", response_model=VerificationResponse)
def get_document_verification_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    DocumentService.sync_mock_documents(db)
    verification = db["verification_results"].find_one({"document_id": id})
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification results not found."
        )
    return verification


@router.post("/{id}/notes", response_model=UnifiedDocumentResponse)
def add_document_note_endpoint(
    id: str,
    payload: DocumentNoteCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    doc = DocumentService.add_note(
        db=db,
        document_id=id,
        text=payload.text,
        operator_email=current_user.get("email", "system")
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    return doc


@router.delete("/{id}")
def delete_document_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    success = DocumentService.delete_document_and_log(
        db=db,
        document_id=id,
        operator_email=current_user.get("email", "system")
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    return {"success": True}
