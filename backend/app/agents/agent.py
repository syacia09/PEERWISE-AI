"""
PEERWISE Central Agent: orkestrasi percakapan AI dengan tool calling.
"""
import json
import os
import uuid
from pathlib import Path
from typing import Optional
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.agents.tools import (
    TOOLS,
    execute_search_tutors,
    execute_book_tutor,
    execute_generate_learning_brief,
    execute_generate_evaluation,
    execute_generate_report,
)
from app.models.database import ChatHistory

client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

# Load system prompt dari file
_PROMPT_PATH = Path(__file__).parent.parent.parent.parent / "prompts" / "system_prompt.md"


def load_system_prompt() -> str:
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return _FALLBACK_SYSTEM_PROMPT


_FALLBACK_SYSTEM_PROMPT = """Kamu adalah PEERWISE Central Agent, asisten pembelajaran peer-to-peer untuk mahasiswa di platform PEERWISE AI."""


def _format_tutor_card(t: dict, rank: int) -> str:
    """Format satu tutor menjadi teks untuk LLM."""
    badge = " 🏆 (Paling sesuai)" if rank == 1 else ""
    verif = "✅ Terverifikasi" if t["is_verified"] else "⚠️ Belum terverifikasi"
    jadwal_str = ", ".join(t["jadwal"]) if isinstance(t["jadwal"], list) else t["jadwal"]
    topik_str = ", ".join(t["topik"]) if isinstance(t["topik"], list) else t["topik"]
    return (
        f"**{rank}. {t['name']}** — Skor: {t['score']}/100{badge}\n"
        f"   - {verif} | Semester {t['semester']} | {t['mata_kuliah']}\n"
        f"   - Harga: Rp{t['harga_per_sesi']:,}/sesi | Mode: {t['mode']}"
        + (f" | Lokasi: {t['lokasi']}" if t.get('lokasi') else "") + "\n"
        f"   - Jadwal: {jadwal_str}\n"
        f"   - Topik: {topik_str}\n"
        f"   - Rating: ⭐{t['rating']} ({t['jumlah_sesi']} sesi)\n"
        f"   - tutor_id: {t['tutor_id']}"
    )


async def run_agent(
    user_message: str,
    session_id: str,
    student_id: int,
    db: Session,
    history: Optional[list] = None,
) -> dict:
    """
    Proses satu giliran percakapan agent.
    Returns: {"message": str, "tool_result": dict | None, "session_id": str}
    """
    system_prompt = load_system_prompt()

    # Build messages
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    # Save user message to DB
    db.add(ChatHistory(
        user_id=student_id,
        session_id=session_id,
        role="user",
        content=user_message,
    ))
    db.commit()

    tool_result_data = None
    final_message = ""

    # Agentic loop (max 3 iterasi)
    for _ in range(3):
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=1500,
            temperature=0.7,
        )

        msg = response.choices[0].message

        if msg.tool_calls:
            # Append assistant message dengan tool call
            messages.append(msg)

            # Eksekusi setiap tool call
            for tc in msg.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)

                tool_output = await _dispatch_tool(fn_name, fn_args, student_id, db)
                tool_result_data = {"tool": fn_name, "result": tool_output}

                # Format tool result untuk LLM
                tool_content = _format_tool_result(fn_name, tool_output)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": tool_content,
                })

        else:
            # Final response
            final_message = msg.content or ""
            break

    # Save assistant response
    if final_message:
        db.add(ChatHistory(
            user_id=student_id,
            session_id=session_id,
            role="assistant",
            content=final_message,
            metadata_=json.dumps(tool_result_data) if tool_result_data else None,
        ))
        db.commit()

    return {
        "message": final_message,
        "tool_result": tool_result_data,
        "session_id": session_id,
    }


async def _dispatch_tool(fn_name: str, fn_args: dict, student_id: int, db: Session) -> dict:
    """Route tool call ke executor yang tepat."""
    if fn_name == "search_tutors":
        return execute_search_tutors(fn_args, db)
    elif fn_name == "book_tutor":
        return execute_book_tutor(fn_args, student_id, db)
    elif fn_name == "generate_learning_brief":
        return await execute_generate_learning_brief(fn_args, db)
    elif fn_name == "generate_evaluation":
        return await execute_generate_evaluation(fn_args, db)
    elif fn_name == "generate_report":
        return await execute_generate_report(fn_args, db)
    else:
        return {"error": f"Tool '{fn_name}' tidak dikenal"}


def _format_tool_result(fn_name: str, result: dict) -> str:
    """Format hasil tool untuk dikirim kembali ke LLM."""
    if fn_name == "search_tutors":
        if result.get("no_budget_match") or result.get("count", 0) == 0:
            return json.dumps({
                "status": "no_match",
                "message": "Tidak ada tutor yang cocok dengan anggaran tersebut.",
                "params": result.get("params", {})
            }, ensure_ascii=False)

        cards = []
        for i, t in enumerate(result["results"], 1):
            cards.append(_format_tutor_card(t, i))

        return json.dumps({
            "status": "found",
            "count": result["count"],
            "params": result.get("params", {}),
            "tutors_formatted": "\n\n".join(cards),
            "tutors_data": result["results"],
        }, ensure_ascii=False)

    elif fn_name == "book_tutor":
        return json.dumps(result, ensure_ascii=False)

    elif fn_name == "generate_learning_brief":
        return json.dumps(result, ensure_ascii=False)

    elif fn_name == "generate_evaluation":
        if "questions" in result:
            return json.dumps({
                "status": "ready",
                "booking_id": result["booking_id"],
                "jumlah_soal": len(result["questions"]),
                "questions": result["questions"],
            }, ensure_ascii=False)
        return json.dumps(result, ensure_ascii=False)

    elif fn_name == "generate_report":
        return json.dumps(result, ensure_ascii=False)

    return json.dumps(result, ensure_ascii=False)


def get_or_create_session(user_id: int, db: Session) -> str:
    """Ambil session aktif atau buat baru."""
    latest = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.desc())
        .first()
    )
    if latest:
        return latest.session_id
    return str(uuid.uuid4())


def get_chat_history(session_id: str, user_id: int, db: Session, limit: int = 20) -> list:
    """Ambil history chat untuk session tertentu."""
    rows = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.session_id == session_id,
            ChatHistory.user_id == user_id,
        )
        .order_by(ChatHistory.created_at.asc())
        .limit(limit)
        .all()
    )
    return [{"role": r.role, "content": r.content} for r in rows]
