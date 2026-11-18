"""
Evaluation routes: generate soal, submit jawaban, lihat laporan.
"""
from __future__ import annotations
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import get_db, User, Booking, Evaluation
from app.core.auth import require_student
from app.agents.tools import execute_generate_evaluation, execute_generate_report

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("/{booking_id}/generate")
async def generate_evaluation(
    booking_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Generate soal evaluasi untuk booking yang selesai."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.student_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if booking.status != "selesai":
        raise HTTPException(status_code=400, detail="Sesi belum selesai")

    result = await execute_generate_evaluation({"booking_id": booking_id}, db)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


class SubmitAnswersRequest(BaseModel):
    answers: list[str]


@router.post("/{booking_id}/submit")
async def submit_answers(
    booking_id: int,
    req: SubmitAnswersRequest,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Submit jawaban student dan generate laporan."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.student_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    evaluation = db.query(Evaluation).filter(Evaluation.booking_id == booking_id).first()
    if not evaluation:
        raise HTTPException(status_code=400, detail="Evaluasi belum digenerate")

    result = await execute_generate_report(
        {"booking_id": booking_id, "answers": req.answers}, db
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@router.get("/{booking_id}")
def get_evaluation(
    booking_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Ambil data evaluasi dan laporan."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.student_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    evaluation = db.query(Evaluation).filter(Evaluation.booking_id == booking_id).first()
    if not evaluation:
        return {"booking_id": booking_id, "status": "belum_ada"}

    questions_data = json.loads(evaluation.questions) if evaluation.questions else {}
    return {
        "booking_id": booking_id,
        "questions": questions_data.get("questions", []),
        "answers": json.loads(evaluation.answers) if evaluation.answers else None,
        "score_before": evaluation.score_before,
        "score_after": evaluation.score_after,
        "report": json.loads(evaluation.report) if evaluation.report else None,
    }
