import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import UserModel
from app.core.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

@router.post("/register", response_model=TokenResponse)
async def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    existing = db.query(UserModel).filter(UserModel.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = UserModel(
        id=str(uuid.uuid4()),
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password)
    )
    db.add(user)
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token, email=user.email)

@router.post("/login", response_model=TokenResponse)
async def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token, email=user.email)

@router.get("/me")
async def get_me(user: UserModel = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
