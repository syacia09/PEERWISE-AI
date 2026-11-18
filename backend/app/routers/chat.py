"""
Chat routes: AI Agent conversation endpoint.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, User, ChatHistory
from app.core.auth import require_student
from app.agents.agent import run_agent, get_or_create_session, get_chat_history

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@router.post("/")
async def chat(
    req: ChatRequest,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Proses satu giliran percakapan dengan AI Agent."""
    session_id = req.session_id or get_or_create_session(user.id, db)
    if not session_id:
        session_id = str(uuid.uuid4())

    # Ambil history untuk konteks
    history = get_chat_history(session_id, user.id, db, limit=20)

    result = await run_agent(
        user_message=req.message,
        session_id=session_id,
        student_id=user.id,
        db=db,
        history=history,  # agent akan append user message sendiri
    )

    return {
        "message": result["message"],
        "tool_result": result["tool_result"],
        "session_id": result["session_id"],
    }


@router.get("/history")
def get_history(
    session_id: Optional[str] = None,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Ambil riwayat percakapan."""
    sid = session_id or get_or_create_session(user.id, db)
    if not sid:
        return {"session_id": None, "messages": []}

    rows = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.user_id == user.id,
            ChatHistory.session_id == sid,
        )
        .order_by(ChatHistory.created_at.asc())
        .all()
    )

    messages = []
    for r in rows:
        msg = {"role": r.role, "content": r.content, "created_at": r.created_at.isoformat()}
        if r.metadata_:
            import json
            try:
                msg["metadata"] = json.loads(r.metadata_)
            except Exception:
                pass
        messages.append(msg)

    return {"session_id": sid, "messages": messages}


@router.post("/new-session")
def new_session(
    user: User = Depends(require_student),
):
    """Mulai sesi percakapan baru."""
    return {"session_id": str(uuid.uuid4())}
