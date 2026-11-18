"""
Weighted scoring engine untuk matching tutor-student.
Bobot: materi 35%, kompetensi 25%, jadwal 15%, harga 15%, rating/pengalaman 10%
"""
from __future__ import annotations
import json
from typing import Optional
from app.models.database import TutorProfile, User


def compute_topic_score(topik_tutor: list[str], topik_dicari: list[str]) -> float:
    """
    Hitung skor kecocokan topik (0-100).
    Fuzzy match: cari substring di topik tutor.
    """
    if not topik_dicari:
        return 50.0  # netral jika tidak ada spesifik

    tutor_topics_lower = [t.lower() for t in topik_tutor]
    matches = 0
    for topik in topik_dicari:
        topik_lower = topik.lower()
        # Exact match atau substring
        for t in tutor_topics_lower:
            if topik_lower in t or t in topik_lower:
                matches += 1
                break

    return min(100.0, (matches / len(topik_dicari)) * 100)


def compute_subject_score(mata_kuliah_tutor: str, mata_kuliah_dicari: str) -> float:
    """Mata kuliah sama: 100, berbeda: 0."""
    if not mata_kuliah_dicari:
        return 50.0
    if mata_kuliah_tutor.lower() == mata_kuliah_dicari.lower():
        return 100.0
    # Partial match (mis. "Matematika" vs "Math")
    if (mata_kuliah_tutor.lower() in mata_kuliah_dicari.lower() or
            mata_kuliah_dicari.lower() in mata_kuliah_tutor.lower()):
        return 70.0
    return 0.0


def compute_materi_score(profile: TutorProfile, mata_kuliah: str, topik_list: list[str]) -> float:
    """Gabungan subject + topik, bobot 60/40."""
    subject_score = compute_subject_score(profile.mata_kuliah, mata_kuliah)
    if subject_score == 0.0:
        return 0.0  # berbeda mata kuliah total → skip
    topik_tutor = json.loads(profile.topik) if isinstance(profile.topik, str) else profile.topik
    topic_score = compute_topic_score(topik_tutor, topik_list)
    return subject_score * 0.6 + topic_score * 0.4


def compute_kompetensi_score(profile: TutorProfile) -> float:
    """
    Skor kompetensi berbasis semester (lebih senior = lebih tinggi) + status verifikasi.
    Skala 0-100.
    """
    sem_score = min(100.0, (profile.semester / 8) * 100)
    verif_bonus = 15.0 if profile.is_verified else 0.0
    return min(100.0, sem_score * 0.85 + verif_bonus)


def compute_jadwal_score(profile: TutorProfile, jadwal_dicari: Optional[list[str]]) -> float:
    """
    Hitung overlap jadwal.
    Jika student tidak menyebut preferensi → 70 (netral).
    """
    if not jadwal_dicari:
        return 70.0

    tutor_jadwal = json.loads(profile.jadwal) if isinstance(profile.jadwal, str) else profile.jadwal
    tutor_jadwal_lower = [j.lower() for j in tutor_jadwal]

    DAY_ALIASES = {
        "senin": ["sen", "monday", "mon"],
        "selasa": ["sel", "tuesday", "tue"],
        "rabu": ["rab", "wednesday", "wed"],
        "kamis": ["kam", "thursday", "thu"],
        "jumat": ["jum", "friday", "fri"],
        "sabtu": ["sab", "saturday", "sat"],
        "minggu": ["min", "sunday", "sun"],
    }

    matches = 0
    for pref in jadwal_dicari:
        pref_lower = pref.lower()
        for slot in tutor_jadwal_lower:
            if pref_lower in slot or slot in pref_lower:
                matches += 1
                break
            # check day aliases
            for day, aliases in DAY_ALIASES.items():
                if (day in pref_lower or any(a in pref_lower for a in aliases)) and day in slot:
                    matches += 1
                    break

    return min(100.0, (matches / len(jadwal_dicari)) * 100)


def compute_harga_score(profile: TutorProfile, anggaran_max: Optional[int]) -> float:
    """
    Harga dalam anggaran: nilai makin tinggi makin murah (relatif terhadap anggaran).
    Melebihi anggaran → 0.
    """
    if anggaran_max is None:
        return 70.0
    if profile.harga_per_sesi > anggaran_max:
        return 0.0
    # Semakin murah dari anggaran → lebih baik
    ratio = profile.harga_per_sesi / anggaran_max
    return max(0.0, (1 - ratio) * 50 + 50)  # range 50-100


def compute_rating_score(profile: TutorProfile) -> float:
    """Rating (maks 5) + bonus pengalaman sesi."""
    rating_score = (profile.rating / 5.0) * 70
    exp_score = min(30.0, (profile.jumlah_sesi / 50) * 30)
    return rating_score + exp_score


def compute_mode_score(profile: TutorProfile, mode_dicari: Optional[str]) -> float:
    """
    Bonus/penalty berdasarkan kecocokan mode.
    Tidak mempengaruhi skor utama, hanya filter soft.
    """
    if not mode_dicari:
        return 1.0  # multiplier netral
    if profile.mode == "both":
        return 1.0
    if profile.mode == mode_dicari:
        return 1.0
    return 0.7  # penalti mode tidak cocok


def score_tutor(
    profile: TutorProfile,
    mata_kuliah: str,
    topik_list: list[str],
    anggaran_max: Optional[int] = None,
    jadwal_dicari: Optional[list[str]] = None,
    mode_dicari: Optional[str] = None,
) -> dict:
    """
    Hitung skor total weighted 0-100 untuk satu tutor.
    Returns dict dengan breakdown skor.
    """
    materi = compute_materi_score(profile, mata_kuliah, topik_list)
    kompetensi = compute_kompetensi_score(profile)
    jadwal = compute_jadwal_score(profile, jadwal_dicari)
    harga = compute_harga_score(profile, anggaran_max)
    rating = compute_rating_score(profile)

    # Jika harga melebihi anggaran, langsung score 0
    if anggaran_max and profile.harga_per_sesi > anggaran_max:
        harga = 0.0

    # Weighted total
    total = (
        materi * 0.35 +
        kompetensi * 0.25 +
        jadwal * 0.15 +
        harga * 0.15 +
        rating * 0.10
    )

    # Mode multiplier (soft filter)
    mode_mult = compute_mode_score(profile, mode_dicari)
    total = total * mode_mult

    return {
        "total": round(total, 1),
        "breakdown": {
            "materi": round(materi, 1),
            "kompetensi": round(kompetensi, 1),
            "jadwal": round(jadwal, 1),
            "harga": round(harga, 1),
            "rating_exp": round(rating, 1),
        },
        "exceeds_budget": anggaran_max is not None and profile.harga_per_sesi > anggaran_max,
    }


def rank_tutors(
    tutors: list[tuple[TutorProfile, User]],
    mata_kuliah: str,
    topik_list: list[str],
    anggaran_max: Optional[int] = None,
    jadwal_dicari: Optional[list[str]] = None,
    mode_dicari: Optional[str] = None,
    top_n: int = 3,
) -> list[dict]:
    """
    Rank semua tutor dan kembalikan top_n terbaik.
    Tutors yang melebihi anggaran tidak masuk top_n utama.
    """
    scored = []
    for profile, user in tutors:
        score = score_tutor(
            profile, mata_kuliah, topik_list,
            anggaran_max, jadwal_dicari, mode_dicari
        )
        topik_tutor = json.loads(profile.topik) if isinstance(profile.topik, str) else profile.topik
        jadwal_tutor = json.loads(profile.jadwal) if isinstance(profile.jadwal, str) else profile.jadwal
        scored.append({
            "tutor_id": profile.id,
            "user_id": user.id,
            "name": user.name,
            "mata_kuliah": profile.mata_kuliah,
            "topik": topik_tutor,
            "semester": profile.semester,
            "harga_per_sesi": profile.harga_per_sesi,
            "jadwal": jadwal_tutor,
            "mode": profile.mode,
            "lokasi": profile.lokasi,
            "rating": profile.rating,
            "jumlah_sesi": profile.jumlah_sesi,
            "is_verified": profile.is_verified,
            "bio": profile.bio,
            "score": score["total"],
            "score_breakdown": score["breakdown"],
            "exceeds_budget": score["exceeds_budget"],
        })

    # Sort: in-budget first, then by score
    in_budget = [t for t in scored if not t["exceeds_budget"]]
    over_budget = [t for t in scored if t["exceeds_budget"]]

    in_budget.sort(key=lambda x: x["score"], reverse=True)
    over_budget.sort(key=lambda x: x["score"], reverse=True)

    result = in_budget[:top_n]
    # If less than top_n in budget, don't pad with over-budget (show honest message)
    return result
