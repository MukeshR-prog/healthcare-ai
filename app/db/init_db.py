from pymongo.database import Database


def ensure_collections_and_indexes(db: Database) -> None:
    """Create collections and indexes if they do not already exist."""
    existing = set(db.list_collection_names())

    if "claims" not in existing:
        db.create_collection("claims")
    if "predictions" not in existing:
        db.create_collection("predictions")

    db["claims"].create_index("created_at")
    db["predictions"].create_index("claim_id")
    db["predictions"].create_index("created_at")
