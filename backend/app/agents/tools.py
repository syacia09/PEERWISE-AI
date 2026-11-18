"""
AI Agent tools untuk PEERWISE AI.
LLM memahami kebutuhan → parameter terstruktur → scoring engine → hasil ranking.
"""
import json
import os
from typing import Optional
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.models.database import TutorProfile, User, Booking, LearningBrief, Evaluation
from app.core.scoring import rank_tutors

client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ─── Tool Definitions ───────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_tutors",
            "description": (
                "Cari dan ranking tutor berdasarkan kebutuhan student. "
                "Gunakan setelah berhasil mengumpulkan: mata_kuliah, topik, anggaran, jadwal, mode."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "mata_kuliah": {
                        "type": "string",
                        "description": "Nama mata kuliah, e.g. 'Matematika', 'Informatika', 'Statistika', 'Akuntansi'"
                    },
                    "topik": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Daftar topik spesifik yang sulit, e.g. ['Kalkulus Integral', 'substitusi']"
                    },
                    "anggaran_max": {
                        "type": "integer",
                        "description": "Anggaran maksimal per sesi dalam Rupiah, e.g. 30000"
                    },
                    "jadwal": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Preferensi hari/waktu, e.g. ['Senin', 'Rabu pagi']"
                    },
                    "mode": {
                        "type": "string",
                        "enum": ["online", "offline", "both"],
                        "description": "Preferensi mode belajar"
                    },
                    "tingkat_pemahaman": {
                        "type": "integer",
                        "description": "Skala 1-5, 1=sangat tidak paham, 5=sudah hampir paham"
                    },
                    "deadline": {
                        "type": "string",
                        "description": "Kapan ujian/kuis/deadline, e.g. 'Senin minggu depan'"
                    }
                },
                "required": ["mata_kuliah", "topik"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_tutor",
            "description": "Buat booking setelah student memilih tutor dan jadwal.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tutor_id": {"type": "integer", "description": "ID tutor profile"},
                    "jadwal_dipilih": {"type": "string", "description": "Slot jadwal spesifik"},
                    "mata_kuliah": {"type": "string"},
                    "topik": {"type": "string", "description": "Topik yang ingin dipelajari"},
                    "mode": {"type": "string"},
                    "catatan": {"type": "string", "description": "Catatan tambahan untuk tutor"}
                },
                "required": ["tutor_id", "jadwal_dipilih", "mata_kuliah", "topik", "mode"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_learning_brief",
            "description": "Generate learning brief untuk tutor setelah booking diterima.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer"}
                },
                "required": ["booking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_evaluation",
            "description": "Generate soal evaluasi pasca sesi untuk student.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer"}
                },
                "required": ["booking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_report",
            "description": "Generate Post-Class Learning Report setelah student menjawab evaluasi.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer"},
                    "answers": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Jawaban student untuk setiap soal"
                    }
                },
                "required": ["booking_id", "answers"]
            }
        }
    }
]


# ─── Tool Executors ──────────────────────────────────────────────────────────

def execute_search_tutors(params: dict, db: Session) -> dict:
    """Jalankan scoring dan kembalikan top 3 tutor."""
    mata_kuliah = params.get("mata_kuliah", "")
    topik = params.get("topik", [])
    anggaran_max = params.get("anggaran_max")
    jadwal = params.get("jadwal", [])
    mode = params.get("mode")

    # Ambil semua tutor dari DB
    rows = db.query(TutorProfile, User).join(User, TutorProfile.user_id == User.id).all()

    ranked = rank_tutors(
        tutors=rows,
        mata_kuliah=mata_kuliah,
        topik_list=topik,
        anggaran_max=anggaran_max,
        jadwal_dicari=jadwal,
        mode_dicari=mode,
        top_n=3,
    )

    return {
        "params": params,
        "results": ranked,
        "count": len(ranked),
        "no_budget_match": len(ranked) == 0 and anggaran_max is not None,
    }


def execute_book_tutor(params: dict, student_id: int, db: Session) -> dict:
    """Buat booking baru."""
    booking = Booking(
        student_id=student_id,
        tutor_id=params["tutor_id"],
        mata_kuliah=params["mata_kuliah"],
        topik=params["topik"],
        jadwal_dipilih=params["jadwal_dipilih"],
        mode=params["mode"],
        catatan=params.get("catatan", ""),
        status="menunggu",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"booking_id": booking.id, "status": "menunggu", "message": "Booking berhasil dibuat!"}


async def execute_generate_learning_brief(params: dict, db: Session) -> dict:
    """Generate learning brief via LLM."""
    booking_id = params["booking_id"]
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return {"error": "Booking tidak ditemukan"}

    student = db.query(User).filter(User.id == booking.student_id).first()
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == booking.tutor_id).first()
    tutor_user = db.query(User).filter(User.id == tutor_profile.user_id).first()

    prompt = f"""Buat Learning Brief dalam Bahasa Indonesia untuk sesi tutoring berikut:

Murid: {student.name} | Jurusan: {student.jurusan} | Semester: {student.semester}
Tutor: {tutor_user.name}
Mata Kuliah: {booking.mata_kuliah}
Topik: {booking.topik}
Jadwal: {booking.jadwal_dipilih}
Mode: {booking.mode}

Buat dalam format JSON dengan field:
- murid (nama, jurusan, semester)
- mata_kuliah_target
- topik_prioritas (array, urut dari yang paling perlu)
- tingkat_pemahaman_awal (teks deskriptif)
- deadline (dari catatan jika ada)
- saran_fokus_sesi (array poin)
- estimasi_waktu_per_topik (object topik:menit)
"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=800,
    )

    brief_content = response.choices[0].message.content

    # Simpan ke DB
    existing = db.query(LearningBrief).filter(LearningBrief.booking_id == booking_id).first()
    if existing:
        existing.content = brief_content
    else:
        brief = LearningBrief(booking_id=booking_id, content=brief_content)
        db.add(brief)
    db.commit()

    return {"booking_id": booking_id, "brief": json.loads(brief_content)}


async def execute_generate_evaluation(params: dict, db: Session) -> dict:
    """Generate soal evaluasi untuk booking yang selesai."""
    booking_id = params["booking_id"]
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return {"error": "Booking tidak ditemukan"}

    prompt = f"""Buat 5 soal evaluasi singkat dalam Bahasa Indonesia untuk topik berikut:
Mata Kuliah: {booking.mata_kuliah}
Topik: {booking.topik}

Format JSON dengan field:
- questions: array of {{
    "id": number,
    "pertanyaan": string,
    "tipe": "pilihan_ganda" atau "essay_singkat",
    "pilihan": array of string (hanya untuk pilihan_ganda, 4 pilihan A/B/C/D),
    "kunci_jawaban": string,
    "topik_terkait": string
  }}

Pastikan soal beragam tingkat kesulitan: 2 mudah, 2 sedang, 1 sulit.
"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=1200,
    )

    questions_content = response.choices[0].message.content
    questions_data = json.loads(questions_content)

    # Simpan ke DB
    existing = db.query(Evaluation).filter(Evaluation.booking_id == booking_id).first()
    if existing:
        existing.questions = questions_content
    else:
        evaluation = Evaluation(booking_id=booking_id, questions=questions_content)
        db.add(evaluation)
    db.commit()

    return {"booking_id": booking_id, "questions": questions_data.get("questions", [])}


async def execute_generate_report(params: dict, db: Session) -> dict:
    """Generate Post-Class Learning Report."""
    booking_id = params["booking_id"]
    answers = params["answers"]

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    evaluation = db.query(Evaluation).filter(Evaluation.booking_id == booking_id).first()
    if not booking or not evaluation:
        return {"error": "Data tidak lengkap"}

    questions_data = json.loads(evaluation.questions)
    questions = questions_data.get("questions", [])

    # Hitung skor
    correct = 0
    details = []
    for i, q in enumerate(questions):
        answer = answers[i] if i < len(answers) else ""
        is_correct = answer.strip().upper() == q.get("kunci_jawaban", "").strip().upper()
        if is_correct:
            correct += 1
        details.append({
            "pertanyaan": q["pertanyaan"],
            "jawaban_student": answer,
            "kunci": q["kunci_jawaban"],
            "benar": is_correct,
            "topik": q.get("topik_terkait", ""),
        })

    score_after = int((correct / len(questions)) * 100) if questions else 0
    score_before = evaluation.score_before or 40  # estimasi awal

    # LLM untuk narasi laporan
    prompt = f"""Buat Post-Class Learning Report dalam Bahasa Indonesia (format JSON):

Mata Kuliah: {booking.mata_kuliah}
Topik: {booking.topik}
Skor Sebelum Sesi: {score_before}/100
Skor Sesudah Sesi: {score_after}/100
Detail Jawaban: {json.dumps(details, ensure_ascii=False)}

Format JSON:
{{
  "ringkasan_materi": string,
  "skor_sebelum": {score_before},
  "skor_sesudah": {score_after},
  "topik_dikuasai": [array string],
  "topik_perlu_diperkuat": [array string],
  "rekomendasi_sesi_berikutnya": string,
  "pesan_semangat": string
}}"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=800,
    )

    report_content = response.choices[0].message.content

    # Update evaluation
    evaluation.answers = json.dumps(answers)
    evaluation.score_before = score_before
    evaluation.score_after = score_after
    evaluation.report = report_content
    db.commit()

    return {"booking_id": booking_id, "report": json.loads(report_content)}
