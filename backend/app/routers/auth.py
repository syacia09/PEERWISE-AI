"""
Auth routes: register dan login.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta
from app.models.database import get_db, User

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "peerwise-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    role: str  # "student" | "tutor"
    jurusan: str | None = None
    semester: int | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


def create_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    if req.role not in ("student", "tutor"):
        raise HTTPException(status_code=400, detail="Role harus 'student' atau 'tutor'")

    user = User(
        email=req.email,
        name=req.name,
        password_hash=pwd_context.hash(req.password),
        role=req.role,
        jurusan=req.jurusan,
        semester=req.semester,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.role)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "jurusan": user.jurusan,
            "semester": user.semester,
        }
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_token(user.id, user.role)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "jurusan": user.jurusan,
            "semester": user.semester,
        }
    }
