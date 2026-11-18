"""
Learning Brief route: generate dan ambil brief.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, User, Booking, LearningBrief, TutorProfile
from app.core.auth import get_current_user
from app.agents.tools import execute_generate_learning_brief

router = APIRouter(prefix="/briefs", tags=["briefs"])


@router.post("/{booking_id}/generate")
async def generate_brief(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate learning brief setelah tutor terima booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    # Verifikasi akses: student yang punya booking atau tutor yang menerima
    if user.role == "student" and booking.student_id != user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if user.role == "tutor":
        profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
        if not profile or booking.tutor_id != profile.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    if booking.status not in ("diterima", "selesai"):
        raise HTTPException(status_code=400, detail="Booking harus diterima dulu")

    result = await execute_generate_learning_brief({"booking_id": booking_id}, db)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@router.get("/{booking_id}")
def get_brief(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ambil learning brief."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    brief = db.query(LearningBrief).filter(LearningBrief.booking_id == booking_id).first()
    if not brief:
        return {"booking_id": booking_id, "brief": None}

    return {
        "booking_id": booking_id,
        "brief": json.loads(brief.content),
        "created_at": brief.created_at.isoformat(),
    }
