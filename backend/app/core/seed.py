"""
Seed data: 12 tutor dummy untuk PEERWISE AI.
"""
import json
from passlib.context import CryptContext
from app.models.database import SessionLocal, engine, Base, User, TutorProfile

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TUTORS = [
    {
        "email": "rina.aulia@demo.com",
        "name": "Rina Aulia",
        "password": "demo1234",
        "jurusan": "Matematika",
        "semester_user": 5,
        "profile": {
            "mata_kuliah": "Matematika",
            "topik": json.dumps(["Kalkulus Integral", "integral parsial", "substitusi", "luas daerah"]),
            "semester": 5,
            "harga_per_sesi": 25000,
            "jadwal": json.dumps(["Senin 16:00-19:00", "Rabu 16:00-19:00", "Sabtu 09:00-12:00"]),
            "mode": "offline",
            "lokasi": "Sekitar kampus (perpustakaan)",
            "rating": 4.8,
            "jumlah_sesi": 22,
            "is_verified": True,
            "bio": "Mahasiswa Matematika sem 5, spesialis Kalkulus Integral. Sudah bantu 22 mahasiswa!"
        }
    },
    {
        "email": "dimas.pratama@demo.com",
        "name": "Dimas Pratama",
        "password": "demo1234",
        "jurusan": "Matematika",
        "semester_user": 7,
        "profile": {
            "mata_kuliah": "Matematika",
            "topik": json.dumps(["Kalkulus Diferensial", "Kalkulus Integral", "limit", "turunan"]),
            "semester": 7,
            "harga_per_sesi": 30000,
            "jadwal": json.dumps(["Selasa 19:00-21:00", "Kamis 19:00-21:00"]),
            "mode": "online",
            "lokasi": None,
            "rating": 4.6,
            "jumlah_sesi": 15,
            "is_verified": True,
            "bio": "Sem 7 Matematika. Jago Kalkulus dari dasar sampai lanjut."
        }
    },
    {
        "email": "salsa.maharani@demo.com",
        "name": "Salsa Maharani",
        "password": "demo1234",
        "jurusan": "Matematika",
        "semester_user": 5,
        "profile": {
            "mata_kuliah": "Matematika",
            "topik": json.dumps(["Kalkulus", "Aljabar Linear", "matriks", "vektor"]),
            "semester": 5,
            "harga_per_sesi": 20000,
            "jadwal": json.dumps(["Jumat 15:00-18:00", "Sabtu 10:00-13:00"]),
            "mode": "offline",
            "lokasi": "Sekitar kampus",
            "rating": 4.3,
            "jumlah_sesi": 6,
            "is_verified": False,
            "bio": "Suka ngajarin temen soal Kalkulus dan Aljabar Linear. Harga terjangkau!"
        }
    },
    {
        "email": "fajar.nugroho@demo.com",
        "name": "Fajar Nugroho",
        "password": "demo1234",
        "jurusan": "Informatika",
        "semester_user": 6,
        "profile": {
            "mata_kuliah": "Informatika",
            "topik": json.dumps(["Struktur Data", "Linked List", "Stack", "Queue", "Binary Tree", "Graph"]),
            "semester": 6,
            "harga_per_sesi": 30000,
            "jadwal": json.dumps(["Senin 19:00-22:00", "Selasa 19:00-22:00", "Rabu 19:00-22:00", "Kamis 19:00-22:00", "Jumat 19:00-22:00"]),
            "mode": "online",
            "lokasi": None,
            "rating": 4.9,
            "jumlah_sesi": 30,
            "is_verified": True,
            "bio": "Expert Struktur Data. 30+ sesi, rating tertinggi di platform!"
        }
    },
    {
        "email": "nadia.putri@demo.com",
        "name": "Nadia Putri",
        "password": "demo1234",
        "jurusan": "Informatika",
        "semester_user": 4,
        "profile": {
            "mata_kuliah": "Informatika",
            "topik": json.dumps(["Algoritma", "Pemrograman", "Struktur Data", "sorting", "searching"]),
            "semester": 4,
            "harga_per_sesi": 25000,
            "jadwal": json.dumps(["Sabtu 10:00-14:00", "Minggu 10:00-14:00"]),
            "mode": "both",
            "lokasi": "Sekitar kampus",
            "rating": 4.5,
            "jumlah_sesi": 9,
            "is_verified": True,
            "bio": "Fleksibel online/offline. Cocok buat yang baru belajar Algoritma."
        }
    },
    {
        "email": "bagas.wijaya@demo.com",
        "name": "Bagas Wijaya",
        "password": "demo1234",
        "jurusan": "Statistika",
        "semester_user": 7,
        "profile": {
            "mata_kuliah": "Statistika",
            "topik": json.dumps(["Statistika Dasar", "Probabilitas", "Uji Hipotesis", "regresi", "distribusi normal"]),
            "semester": 7,
            "harga_per_sesi": 30000,
            "jadwal": json.dumps(["Rabu 16:00-20:00", "Jumat 16:00-20:00"]),
            "mode": "online",
            "lokasi": None,
            "rating": 4.7,
            "jumlah_sesi": 18,
            "is_verified": True,
            "bio": "Spesialis Statistika dan Probabilitas. Penjelasan step-by-step."
        }
    },
    {
        "email": "citra.lestari@demo.com",
        "name": "Citra Lestari",
        "password": "demo1234",
        "jurusan": "Akuntansi",
        "semester_user": 5,
        "profile": {
            "mata_kuliah": "Akuntansi",
            "topik": json.dumps(["Akuntansi Dasar", "Laporan Keuangan", "jurnal", "neraca", "laba rugi"]),
            "semester": 5,
            "harga_per_sesi": 25000,
            "jadwal": json.dumps(["Kamis 15:00-18:00", "Minggu 13:00-16:00"]),
            "mode": "offline",
            "lokasi": "Sekitar kampus",
            "rating": 4.4,
            "jumlah_sesi": 11,
            "is_verified": True,
            "bio": "Akuntansi bukan hal yang menakutkan kalau dijelaskan dengan benar!"
        }
    },
    {
        "email": "arif.hidayat@demo.com",
        "name": "Arif Hidayat",
        "password": "demo1234",
        "jurusan": "Matematika",
        "semester_user": 8,
        "profile": {
            "mata_kuliah": "Matematika",
            "topik": json.dumps(["Kalkulus Integral", "Statistika", "persamaan diferensial", "deret tak hingga"]),
            "semester": 8,
            "harga_per_sesi": 35000,
            "jadwal": json.dumps(["Selasa 18:00-21:00", "Kamis 18:00-21:00"]),
            "mode": "online",
            "lokasi": None,
            "rating": 4.9,
            "jumlah_sesi": 40,
            "is_verified": True,
            "bio": "Senior sem 8, pengalaman terbanyak di platform. Kalau bingung, dia orangnya!"
        }
    },
    {
        "email": "dewi.rahmawati@demo.com",
        "name": "Dewi Rahmawati",
        "password": "demo1234",
        "jurusan": "Informatika",
        "semester_user": 6,
        "profile": {
            "mata_kuliah": "Informatika",
            "topik": json.dumps(["Algoritma", "dynamic programming", "greedy", "divide and conquer", "rekursi"]),
            "semester": 6,
            "harga_per_sesi": 28000,
            "jadwal": json.dumps(["Senin 18:00-21:00", "Rabu 18:00-21:00", "Sabtu 09:00-12:00"]),
            "mode": "both",
            "lokasi": "Sekitar kampus",
            "rating": 4.6,
            "jumlah_sesi": 14,
            "is_verified": True,
            "bio": "Jago Algoritma lanjut, dari rekursi sampai DP. Online dan offline bisa!"
        }
    },
    {
        "email": "rizky.firmansyah@demo.com",
        "name": "Rizky Firmansyah",
        "password": "demo1234",
        "jurusan": "Statistika",
        "semester_user": 6,
        "profile": {
            "mata_kuliah": "Statistika",
            "topik": json.dumps(["Statistika Inferensial", "ANOVA", "regresi linear", "korelasi"]),
            "semester": 6,
            "harga_per_sesi": 25000,
            "jadwal": json.dumps(["Selasa 16:00-19:00", "Sabtu 13:00-16:00"]),
            "mode": "offline",
            "lokasi": "Sekitar kampus",
            "rating": 4.3,
            "jumlah_sesi": 8,
            "is_verified": True,
            "bio": "Khusus Statistika Inferensial, cocok buat yang mau penelitian!"
        }
    },
    {
        "email": "amel.kartika@demo.com",
        "name": "Amel Kartika",
        "password": "demo1234",
        "jurusan": "Akuntansi",
        "semester_user": 7,
        "profile": {
            "mata_kuliah": "Akuntansi",
            "topik": json.dumps(["Akuntansi Biaya", "Akuntansi Manajemen", "anggaran", "analisis laporan keuangan"]),
            "semester": 7,
            "harga_per_sesi": 30000,
            "jadwal": json.dumps(["Senin 15:00-18:00", "Rabu 15:00-18:00"]),
            "mode": "online",
            "lokasi": None,
            "rating": 4.5,
            "jumlah_sesi": 12,
            "is_verified": True,
            "bio": "Sem 7 Akuntansi. Spesialis Akuntansi Biaya dan Manajemen."
        }
    },
    {
        "email": "hendra.saputra@demo.com",
        "name": "Hendra Saputra",
        "password": "demo1234",
        "jurusan": "Informatika",
        "semester_user": 5,
        "profile": {
            "mata_kuliah": "Informatika",
            "topik": json.dumps(["Pemrograman Dasar", "Python", "C++", "logika pemrograman", "debugging"]),
            "semester": 5,
            "harga_per_sesi": 20000,
            "jadwal": json.dumps(["Kamis 19:00-22:00", "Minggu 10:00-13:00"]),
            "mode": "both",
            "lokasi": "Sekitar kampus",
            "rating": 4.2,
            "jumlah_sesi": 7,
            "is_verified": False,
            "bio": "Paling sabar ngajarin pemrograman dari nol. Harga bersahabat!"
        }
    },
]

DEMO_STUDENT = {
    "email": "mahasiswa@demo.com",
    "name": "Budi Santoso",
    "password": "demo1234",
    "role": "student",
    "jurusan": "Teknik Informatika",
    "semester": 3,
}


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(User).filter(User.email == "rina.aulia@demo.com").first()
        if existing:
            print("Database already seeded.")
            return

        # Create demo student
        student_user = User(
            email=DEMO_STUDENT["email"],
            name=DEMO_STUDENT["name"],
            password_hash=pwd_context.hash(DEMO_STUDENT["password"]),
            role=DEMO_STUDENT["role"],
            jurusan=DEMO_STUDENT["jurusan"],
            semester=DEMO_STUDENT["semester"],
        )
        db.add(student_user)

        # Create tutors
        for t in TUTORS:
            user = User(
                email=t["email"],
                name=t["name"],
                password_hash=pwd_context.hash(t["password"]),
                role="tutor",
                jurusan=t["jurusan"],
                semester=t["semester_user"],
            )
            db.add(user)
            db.flush()

            profile = TutorProfile(
                user_id=user.id,
                **t["profile"]
            )
            db.add(profile)

        db.commit()
        print(f"Seeded {len(TUTORS)} tutors + 1 demo student.")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
