import os
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from pymongo.database import Database

from app.models.document import Document, OCRExtraction, VerificationResult, DocumentNote
from app.repositories.document_repository import DocumentRepository
from app.services.ocr_service import OCRService
from app.services.verification_service import VerificationService
from app.services.audit_service import AuditService

STORAGE_DIR = os.path.abspath("d:/ML/healthcare-ai/storage/documents")


class DocumentService:
    @staticmethod
    def ensure_storage_dir() -> None:
        if not os.path.exists(STORAGE_DIR):
            os.makedirs(STORAGE_DIR, exist_ok=True)

    @staticmethod
    def upload_document(
        db: Database,
        file_name: str,
        file_content: bytes,
        file_type: str,
        operator_email: str
    ) -> dict | None:
        DocumentService.ensure_storage_dir()

        # 1. Sync mock documents if empty to keep ID sequence clean
        DocumentService.sync_mock_documents(db)

        # 2. Determine sequential document ID
        count = db["documents"].count_documents({})
        doc_id = f"DOC-50{count - 3}" if count >= 4 else f"DOC-50{count + 1}"

        # 3. Save file locally
        storage_path = os.path.join(STORAGE_DIR, f"{doc_id}_{file_name}")
        with open(storage_path, "wb") as f:
            f.write(file_content)

        file_size_kb = f"{round(len(file_content) / 1024)} KB"

        # 4. Save base Document registry
        document = Document(
            document_id=doc_id,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size_kb,
            uploaded_by=operator_email,
            uploaded_at=datetime.now(timezone.utc),
            storage_path=storage_path,
            status="Uploaded"
        )
        DocumentRepository.create_document(db, document)

        # Log DOCUMENT_UPLOADED
        AuditService.log_event(
            db=db,
            event_type="DOCUMENT_UPLOADED",
            entity_type="DOCUMENT",
            entity_id=doc_id,
            action="CREATE",
            description=f"Document file {file_name} was uploaded by {operator_email}.",
            performed_by=operator_email
        )

        # 5. Perform OCR Structured Field Extraction
        extraction = OCRService.extract_text_and_fields(storage_path, file_name)
        extraction.document_id = doc_id
        DocumentRepository.save_extraction(db, extraction)

        # Log OCR_COMPLETED
        AuditService.log_event(
            db=db,
            event_type="OCR_COMPLETED",
            entity_type="DOCUMENT",
            entity_id=doc_id,
            action="UPDATE",
            description="OCR text character and metadata extraction completed.",
            performed_by=operator_email
        )

        # 6. Run Discrepancy Matching Verification
        verification = VerificationService.verify_extraction(db, extraction)
        DocumentRepository.save_verification(db, verification)

        # Update Document status
        db["documents"].update_one(
            {"document_id": doc_id},
            {"$set": {"status": verification.status}}
        )

        # Log Verification Event
        event_type = "DOCUMENT_VERIFIED" if verification.status == "Verified" else "DOCUMENT_FLAGGED"
        desc = "Document verification checks passed successfully." if verification.status == "Verified" else "Document verification checks raised discrepancy warnings/mismatches."
        AuditService.log_event(
            db=db,
            event_type=event_type,
            entity_type="DOCUMENT",
            entity_id=doc_id,
            action="UPDATE",
            description=desc,
            performed_by=operator_email,
            metadata={
                "verification_score": verification.verification_score,
                "status": verification.status,
                "mismatch_count": verification.mismatch_count
            }
        )

        return DocumentRepository.get_document(db, doc_id)

    @staticmethod
    def add_note(db: Database, document_id: str, text: str, operator_email: str) -> dict | None:
        note = DocumentNote(
            text=text.strip(),
            date=datetime.now(timezone.utc),
            analyst=operator_email
        ).model_dump()

        updated_doc = DocumentRepository.add_note(db, document_id, note)
        if updated_doc:
            AuditService.log_event(
                db=db,
                event_type="DOCUMENT_REVIEWED",
                entity_type="DOCUMENT",
                entity_id=document_id,
                action="UPDATE",
                description="Compliance analyst note recorded on document profile.",
                performed_by=operator_email,
                metadata={"note_preview": text[:60]}
            )
        return updated_doc

    @staticmethod
    def delete_document_and_log(db: Database, document_id: str, operator_email: str) -> bool:
        doc = DocumentRepository.get_document_raw(db, document_id)
        if not doc:
            return False

        # Remove local file if exists
        try:
            storage_path = doc.get("storage_path")
            if storage_path and os.path.exists(storage_path):
                os.remove(storage_path)
        except Exception:
            pass

        success = DocumentRepository.delete_document(db, document_id)
        if success:
            AuditService.log_event(
                db=db,
                event_type="DOCUMENT_DELETED",
                entity_type="DOCUMENT",
                entity_id=document_id,
                action="DELETE",
                description="Document metadata and verification history purged.",
                performed_by=operator_email
            )
        return success

    @staticmethod
    def sync_mock_documents(db: Database) -> None:
        """Seeds default mock document data if registry collection is empty."""
        if db["documents"].count_documents({}) > 0:
            return

        mock_docs = [
            {
                "document_id": "DOC-401",
                "file_name": "medical_invoice_johnathan.pdf",
                "file_type": "application/pdf",
                "file_size": "342 KB",
                "uploaded_by": "system",
                "uploaded_at": datetime(2026, 5, 18, 10, 30, tzinfo=timezone.utc),
                "storage_path": "",
                "status": "Warning",
                "notes": [
                    {
                        "text": "Extracted patient name matches Jonathan Doe with slight character deviation. Discrepancy warning raised.",
                        "date": datetime(2026, 5, 18, 10, 45, tzinfo=timezone.utc),
                        "analyst": "System"
                    }
                ]
            },
            {
                "document_id": "DOC-402",
                "file_name": "billing_statement_sarah_connor.jpg",
                "file_type": "image/jpeg",
                "file_size": "1.2 MB",
                "uploaded_by": "system",
                "uploaded_at": datetime(2026, 5, 19, 14, 20, tzinfo=timezone.utc),
                "storage_path": "",
                "status": "Mismatch",
                "notes": [
                    {
                        "text": "Invoice document claim amount list is $18,200. Claim submission lists $21,600. Major mismatch flag raised.",
                        "date": datetime(2026, 5, 19, 14, 30, tzinfo=timezone.utc),
                        "analyst": "System"
                    }
                ]
            },
            {
                "document_id": "DOC-403",
                "file_name": "claim_invoice_alex_mercer.png",
                "file_type": "image/png",
                "file_size": "890 KB",
                "uploaded_by": "system",
                "uploaded_at": datetime(2026, 5, 20, 11, 15, tzinfo=timezone.utc),
                "storage_path": "",
                "status": "Verified",
                "notes": [
                    {
                        "text": "All extracted values match claim registry fields successfully.",
                        "date": datetime(2026, 5, 20, 11, 20, tzinfo=timezone.utc),
                        "analyst": "System"
                    }
                ]
            },
            {
                "document_id": "DOC-404",
                "file_name": "medical_statement_jane_smith.pdf",
                "file_type": "application/pdf",
                "file_size": "210 KB",
                "uploaded_by": "system",
                "uploaded_at": datetime(2026, 5, 21, 16, 40, tzinfo=timezone.utc),
                "storage_path": "",
                "status": "Verified",
                "notes": []
            }
        ]

        for doc_dict in mock_docs:
            document = Document(
                document_id=doc_dict["document_id"],
                file_name=doc_dict["file_name"],
                file_type=doc_dict["file_type"],
                file_size=doc_dict["file_size"],
                uploaded_by=doc_dict["uploaded_by"],
                uploaded_at=doc_dict["uploaded_at"],
                storage_path=doc_dict["storage_path"],
                status=doc_dict["status"],
                notes=[DocumentNote(**n) for n in doc_dict["notes"]]
            )
            DocumentRepository.create_document(db, document)

            # Insert corresponding Mock OCR Extractions
            extraction = OCRService.extract_text_and_fields("", doc_dict["file_name"])
            extraction.document_id = doc_dict["document_id"]
            DocumentRepository.save_extraction(db, extraction)

            # Insert corresponding Mock Verification Results
            verification = VerificationService.verify_extraction(db, extraction)
            DocumentRepository.save_verification(db, verification)

    @staticmethod
    def get_documents(
        db: Database,
        search: str = None,
        status: str = None,
        risk_level: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "uploaded_at",
        sort_dir: int = -1
    ) -> tuple[int, list[dict]]:
        return DocumentRepository.get_documents(db, search, status, risk_level, skip, limit, sort_by, sort_dir)
