import secrets
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, PasswordResetToken
from backend.app.schemas import (
    UserCreate, UserLogin, TokenResponse, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest, ProfileUpdate
)
from backend.app.auth.security import verify_password, get_password_hash, create_access_token
from backend.app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def is_valid_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

@router.post("/signup", response_model=TokenResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    clean_email = (user_in.email or "").strip().lower()
    if not is_valid_email(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email invalid"
        )

    # Validate email uniqueness
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    # Password strength check
    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=clean_email,
        hashed_password=hashed_password,
        full_name=(user_in.full_name or "").strip() or "Quant Researcher",
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_email}",
        theme_preference="dark"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "theme_preference": user.theme_preference
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    clean_email = (creds.email or "").strip().lower()

    # 1. Check email format validity
    if not is_valid_email(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email invalid"
        )

    # 2. Check if account exists in database
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account doesn't exist"
        )

    # 3. Check if password is correct
    if not verify_password(creds.password or "", user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong password"
        )

    token = create_access_token({"sub": user.email, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "theme_preference": user.theme_preference
        }
    }

@router.post("/logout")
def logout():
    # Stateless JWT - frontend clears token; endpoint confirms successful logout
    return {"message": "Successfully logged out of QuantLab session"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # Always return 200 to avoid leaking registered emails
    if not user:
        return {
            "message": "If an account exists with this email, password reset instructions have been generated.",
            "demo_reset_token": None
        }

    # Generate a secure random reset token
    reset_token_str = secrets.token_urlsafe(32)
    expires = datetime.datetime.utcnow() + datetime.timedelta(hours=2)

    db_token = PasswordResetToken(
        user_id=user.id,
        token=reset_token_str,
        expires_at=expires,
        used=False
    )
    db.add(db_token)
    db.commit()

    return {
        "message": "Password reset token generated successfully. In production, this is emailed to the user.",
        "demo_reset_token": reset_token_str
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == req.token,
        PasswordResetToken.used == False
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if datetime.datetime.utcnow() > db_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = get_password_hash(req.new_password)
    db_token.used = True
    db.commit()

    return {"message": "Password reset successfully. You may now log in with your new credentials."}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "theme_preference": current_user.theme_preference,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.put("/profile")
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name.strip()
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url.strip()
    if profile_in.theme_preference is not None:
        current_user.theme_preference = profile_in.theme_preference.strip()

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "theme_preference": current_user.theme_preference
    }
