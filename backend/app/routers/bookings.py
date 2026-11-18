"""
Booking routes: student membuat booking, melihat status, menyelesaikan sesi.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.database import (
    get_db, Booking, TutorProfile, User, LearningBrief, Evaluation
)
from app.core.auth import require_student, get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


class CreateBookingRequest(BaseModel):
    tutor_id: int
    mata_kuliah: str
    topik: str
    jadwal_dipilih: str
    mode: str
    catatan: Optional[str] = None


@router.post("/")
def create_booking(
    req: CreateBookingRequest,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == req.tutor_id).first()
    if not tutor_profile:
        raise HTTPException(status_code=404, detail="Tutor tidak ditemukan")

    booking = Booking(
        student_id=user.id,
        tutor_id=req.tutor_id,
        mata_kuliah=req.mata_kuliah,
        topik=req.topik,
        jadwal_dipilih=req.jadwal_dipilih,
        mode=req.mode,
        catatan=req.catatan or "",
        status="menunggu",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"booking_id": booking.id, "status": booking.status}


@router.get("/")
def get_my_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ambil semua booking milik user (student atau tutor)."""
    if user.role == "student":
        bookings = db.query(Booking).filter(Booking.student_id == user.id).all()
        result = []
        for b in bookings:
            tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == b.tutor_id).first()
            tutor_user = db.query(User).filter(User.id == tutor_profile.user_id).first() if tutor_profile else None
            brief = db.query(LearningBrief).filter(LearningBrief.booking_id == b.id).first()
            evaluation = db.query(Evaluation).filter(Evaluation.booking_id == b.id).first()
            result.append({
                "id": b.id,
                "tutor_name": tutor_user.name if tutor_user else "?",
                "tutor_id": b.tutor_id,
                "mata_kuliah": b.mata_kuliah,
                "topik": b.topik,
                "jadwal_dipilih": b.jadwal_dipilih,
                "mode": b.mode,
                "status": b.status,
                "catatan": b.catatan,
                "created_at": b.created_at.isoformat(),
                "has_brief": brief is not None,
                "has_evaluation": evaluation is not None,
                "has_report": evaluation.report is not None if evaluation else False,
            })
        return result
    return []


@router.get("/{booking_id}")
def get_booking_detail(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    # Verifikasi akses
    if user.role == "student" and booking.student_id != user.id:
        raise HTTPException(status_code=403, detail="Bukan booking kamu")

    tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == booking.tutor_id).first()
    tutor_user = db.query(User).filter(User.id == tutor_profile.user_id).first() if tutor_profile else None
    student = db.query(User).filter(User.id == booking.student_id).first()
    brief = db.query(LearningBrief).filter(LearningBrief.booking_id == booking_id).first()
    evaluation = db.query(Evaluation).filter(Evaluation.booking_id == booking_id).first()

    return {
        "id": booking.id,
        "student_name": student.name if student else "?",
        "tutor_name": tutor_user.name if tutor_user else "?",
        "mata_kuliah": booking.mata_kuliah,
        "topik": booking.topik,
        "jadwal_dipilih": booking.jadwal_dipilih,
        "mode": booking.mode,
        "status": booking.status,
        "catatan": booking.catatan,
        "created_at": booking.created_at.isoformat(),
        "learning_brief": json.loads(brief.content) if brief else None,
        "evaluation": {
            "questions": json.loads(evaluation.questions) if evaluation and evaluation.questions else None,
            "score_before": evaluation.score_before if evaluation else None,
            "score_after": evaluation.score_after if evaluation else None,
            "report": json.loads(evaluation.report) if evaluation and evaluation.report else None,
        } if evaluation else None,
    }


@router.post("/{booking_id}/complete")
def complete_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tandai sesi selesai (bisa oleh student atau tutor)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if booking.status != "diterima":
        raise HTTPException(status_code=400, detail="Booking harus berstatus 'diterima' dulu")

    booking.status = "selesai"
    db.commit()
    return {"booking_id": booking_id, "status": "selesai"}
