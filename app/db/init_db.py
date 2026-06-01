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
