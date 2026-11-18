"""
Tutor routes: profil, jadwal, dan request booking masuk.
"""
from __future__ import annotations
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, TutorProfile, User, Booking, LearningBrief
from app.core.auth import get_current_user, require_tutor

router = APIRouter(prefix="/tutors", tags=["tutors"])


@router.get("/")
def list_tutors(db: Session = Depends(get_db)):
    """Daftar semua tutor (publik)."""
    rows = db.query(TutorProfile, User).join(User, TutorProfile.user_id == User.id).all()
    result = []
    for profile, user in rows:
        result.append(_serialize_tutor(profile, user))
    return result


@router.get("/me")
def get_my_profile(
    user: User = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil tutor belum ada")
    return _serialize_tutor(profile, user)


class TutorProfileUpdate(BaseModel):
    mata_kuliah: Optional[str] = None
    topik: Optional[list[str]] = None
    harga_per_sesi: Optional[int] = None
    jadwal: Optional[list[str]] = None
    mode: Optional[str] = None
    lokasi: Optional[str] = None
    bio: Optional[str] = None


@router.put("/me")
def update_my_profile(
    req: TutorProfileUpdate,
    user: User = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        # Buat profil baru kalau belum ada
        profile = TutorProfile(user_id=user.id,
                               mata_kuliah=req.mata_kuliah or "",
                               topik=json.dumps(req.topik or []),
                               semester=user.semester or 1,
                               harga_per_sesi=req.harga_per_sesi or 25000,
                               jadwal=json.dumps(req.jadwal or []),
                               mode=req.mode or "online")
        db.add(profile)
    else:
        if req.mata_kuliah is not None:
            profile.mata_kuliah = req.mata_kuliah
        if req.topik is not None:
            profile.topik = json.dumps(req.topik)
        if req.harga_per_sesi is not None:
            profile.harga_per_sesi = req.harga_per_sesi
        if req.jadwal is not None:
            profile.jadwal = json.dumps(req.jadwal)
        if req.mode is not None:
            profile.mode = req.mode
        if req.lokasi is not None:
            profile.lokasi = req.lokasi
        if req.bio is not None:
            profile.bio = req.bio

    db.commit()
    db.refresh(profile)
    return _serialize_tutor(profile, user)


@router.get("/me/bookings")
def get_my_bookings(
    user: User = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """Daftar booking masuk untuk tutor ini."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        return []

    bookings = db.query(Booking).filter(Booking.tutor_id == profile.id).all()
    result = []
    for b in bookings:
        student = db.query(User).filter(User.id == b.student_id).first()
        brief = db.query(LearningBrief).filter(LearningBrief.booking_id == b.id).first()
        result.append({
            "id": b.id,
            "student_name": student.name if student else "?",
            "student_jurusan": student.jurusan if student else "?",
            "student_semester": student.semester if student else "?",
            "mata_kuliah": b.mata_kuliah,
            "topik": b.topik,
            "jadwal_dipilih": b.jadwal_dipilih,
            "mode": b.mode,
            "status": b.status,
            "catatan": b.catatan,
            "created_at": b.created_at.isoformat(),
            "learning_brief": json.loads(brief.content) if brief else None,
        })
    return result


class BookingActionRequest(BaseModel):
    action: str  # "terima" | "tolak"


@router.post("/me/bookings/{booking_id}/action")
def handle_booking(
    booking_id: int,
    req: BookingActionRequest,
    user: User = Depends(require_tutor),
    db: Session = Depends(get_db),
):
    """Tutor terima atau tolak booking."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tutor_id == profile.id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if booking.status != "menunggu":
        raise HTTPException(status_code=400, detail="Status booking sudah bukan menunggu")

    if req.action == "terima":
        booking.status = "diterima"
    elif req.action == "tolak":
        booking.status = "ditolak"
    else:
        raise HTTPException(status_code=400, detail="Action harus 'terima' atau 'tolak'")

    db.commit()
    return {"booking_id": booking_id, "status": booking.status}


def _serialize_tutor(profile: TutorProfile, user: User) -> dict:
    topik = json.loads(profile.topik) if isinstance(profile.topik, str) else profile.topik
    jadwal = json.loads(profile.jadwal) if isinstance(profile.jadwal, str) else profile.jadwal
    return {
        "tutor_id": profile.id,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "jurusan": user.jurusan,
        "mata_kuliah": profile.mata_kuliah,
        "topik": topik,
        "semester": profile.semester,
        "harga_per_sesi": profile.harga_per_sesi,
        "jadwal": jadwal,
        "mode": profile.mode,
        "lokasi": profile.lokasi,
        "rating": profile.rating,
        "jumlah_sesi": profile.jumlah_sesi,
        "is_verified": profile.is_verified,
        "bio": profile.bio,
    }
