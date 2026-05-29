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
    db["audit_logs"].create_index("timestamp")
    db["audit_logs"].create_index("action_type")
