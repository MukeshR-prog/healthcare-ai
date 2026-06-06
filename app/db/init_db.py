# pyrefly: ignore [missing-import]
from pymongo.database import Database


def ensure_collections_and_indexes(db: Database) -> None:
    """Create collections and indexes if they do not already exist."""
    existing = set(db.list_collection_names())

    if "claims" not in existing:
        db.create_collection("claims")
    if "predictions" not in existing:
        db.create_collection("predictions")
    if "users" not in existing:
        db.create_collection("users")
    if "alerts" not in existing:
        db.create_collection("alerts")
    if "audit_logs" not in existing:
        db.create_collection("audit_logs")
    if "investigations" not in existing:
        db.create_collection("investigations")
    if "investigation_notes" not in existing:
        db.create_collection("investigation_notes")
    if "investigation_timeline" not in existing:
        db.create_collection("investigation_timeline")
    if "providers" not in existing:
        db.create_collection("providers")

    db["claims"].create_index("created_at")
    db["claims"].create_index("user_id")
    db["predictions"].create_index("claim_id")
    db["predictions"].create_index("created_at")
    db["predictions"].create_index("user_id")
    db["users"].create_index("email", unique=True)
    
    db["alerts"].create_index("status")
    db["alerts"].create_index("severity")
    db["alerts"].create_index("created_at")
    db["alerts"].create_index("claim_id", unique=True)
    db["audit_logs"].create_index("event_type")
    db["audit_logs"].create_index("entity_type")
    db["audit_logs"].create_index("entity_id")
    db["audit_logs"].create_index("performed_by")
    db["audit_logs"].create_index("created_at")

    db["providers"].create_index("provider_id", unique=True)
    db["providers"].create_index("provider_name", unique=True)
    db["providers"].create_index("watchlisted")

    db["investigations"].create_index("case_id", unique=True)
    db["investigations"].create_index("alert_id", unique=True)
    db["investigations"].create_index("status")
    db["investigations"].create_index("priority")
    db["investigations"].create_index("assigned_to")
    db["investigations"].create_index("created_at")
    db["investigation_notes"].create_index("case_id")
    db["investigation_timeline"].create_index("case_id")

    # Document Verification Service collections
    if "documents" not in existing:
        db.create_collection("documents")
    if "ocr_extractions" not in existing:
        db.create_collection("ocr_extractions")
    if "verification_results" not in existing:
        db.create_collection("verification_results")

    db["documents"].create_index("document_id", unique=True)
    db["documents"].create_index("status")
    db["documents"].create_index("uploaded_at")
    db["ocr_extractions"].create_index("document_id", unique=True)
    db["verification_results"].create_index("document_id", unique=True)
    db["verification_results"].create_index("status")

    # Explainability Service collections
    if "explanations" not in existing:
        db.create_collection("explanations")
    if "feature_contributions" not in existing:
        db.create_collection("feature_contributions")
    if "prediction_insights" not in existing:
        db.create_collection("prediction_insights")

    db["explanations"].create_index("prediction_id", unique=True)
    db["explanations"].create_index("claim_id")
    db["explanations"].create_index("generated_at")
    db["explanations"].create_index("risk_level")
    
    db["feature_contributions"].create_index("prediction_id")
    db["feature_contributions"].create_index("feature_name")
    
    db["prediction_insights"].create_index("prediction_id", unique=True)

    # Reporting and Compliance Engine collections
    if "reports" not in existing:
        db.create_collection("reports")
    if "report_templates" not in existing:
        db.create_collection("report_templates")
    if "report_exports" not in existing:
        db.create_collection("report_exports")
    if "scheduled_reports" not in existing:
        db.create_collection("scheduled_reports")

    db["reports"].create_index("report_id", unique=True)
    db["reports"].create_index("report_type")
    db["reports"].create_index("generated_by")
    db["reports"].create_index("generated_at")

    db["report_templates"].create_index("template_name")
    db["report_templates"].create_index("report_type")

    db["report_exports"].create_index("report_id")
    db["report_exports"].create_index("export_type")

    db["scheduled_reports"].create_index("report_type")
    db["scheduled_reports"].create_index("frequency")
    db["scheduled_reports"].create_index("enabled")

    # Copilot Service collections
    if "copilot_conversations" not in existing:
        db.create_collection("copilot_conversations")
    if "copilot_messages" not in existing:
        db.create_collection("copilot_messages")
    if "copilot_insights" not in existing:
        db.create_collection("copilot_insights")

    db["copilot_conversations"].create_index("user_id")
    db["copilot_conversations"].create_index("conversation_id", unique=True)
    db["copilot_messages"].create_index("conversation_id")
    db["copilot_insights"].create_index("conversation_id")
    db["copilot_insights"].create_index("insight_type")


