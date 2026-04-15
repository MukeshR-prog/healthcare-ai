from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.connection import get_database
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    create_access_token,
    create_reset_token,
    decode_token,
    encrypt_raw_password,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register_user(payload: RegisterRequest, db: Database = Depends(get_database)):
    existing = db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = User(
        email=payload.email,
        password=hash_password(payload.password),
        rawpassword=encrypt_raw_password(payload.password),
    )
    user_payload = user_doc.model_dump(by_alias=True, exclude={"id"})
    result = db["users"].insert_one(user_payload)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id=user_id, email=payload.email)

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=payload.email,
    )


@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Database = Depends(get_database)):
    user_doc = db["users"].find_one({"email": payload.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user_doc["_id"])
    token = create_access_token(user_id=user_id, email=user_doc["email"])

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=user_doc["email"],
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Database = Depends(get_database)):
    user_doc = db["users"].find_one({"email": payload.email})
    if not user_doc:
        return ForgotPasswordResponse(message="If the account exists, a reset link has been sent")

    reset_token = create_reset_token(user_id=str(user_doc["_id"]), email=user_doc["email"])
    return ForgotPasswordResponse(
        message="Reset token generated",
        reset_token=reset_token,
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Database = Depends(get_database)):
    token_payload = decode_token(payload.token)
    if token_payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")

    user_id = token_payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid reset token subject")

    update_result = db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password": hash_password(payload.new_password),
                "rawpassword": encrypt_raw_password(payload.new_password),
            }
        },
    )
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return MessageResponse(message="Password reset successful")
