# PEERWISE AI 🎓

> Platform tutoring peer-to-peer antar mahasiswa dengan AI Agent
> **Demo Capstone Project** — React + FastAPI + Gemini 2.5 Flash Tool Calling

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🤖 AI Chat | Agent menggali kebutuhan belajar lewat percakapan natural |
| 🔍 Smart Matching | Weighted scoring engine (Python) + LLM untuk ranking & narasi |
| 📅 Booking | Student pesan tutor, tutor terima/tolak, status real-time |
| 📄 Learning Brief | AI generate brief terstruktur untuk tutor setelah booking diterima |
| 📝 Evaluasi | AI buat soal pasca sesi, nilai otomatis, hasilkan laporan perkembangan |
| 👩‍🏫 Tutor Dashboard | Kelola profil, jadwal, harga, permintaan booking masuk |

---

## Arsitektur

```
peerwise-ai/
├── backend/                # Python FastAPI
│   ├── main.py             # Entry point, CORS, lifespan
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── models/
│       │   └── database.py  # SQLAlchemy models + SQLite
│       ├── core/
│       │   ├── seed.py      # 12 tutor dummy + 1 student demo
│       │   ├── scoring.py   # Weighted matching engine (0-100)
│       │   └── auth.py      # JWT dependency
│       ├── agents/
│       │   ├── agent.py     # Agentic loop, tool dispatch
│       │   └── tools.py     # Tool definitions + executors
│       └── routers/
│           ├── auth.py      # POST /auth/login, /auth/register
│           ├── tutors.py    # GET/PUT /tutors/me, booking actions
│           ├── bookings.py  # Booking CRUD
│           ├── chat.py      # POST /chat/ (AI Agent)
│           ├── evaluations.py
│           └── briefs.py
├── frontend/               # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx          # Router
│   │   ├── pages/           # Login, Register, Chat, Bookings, Eval, Tutor pages
│   │   ├── components/ui/   # Layout, Badge
│   │   ├── lib/api.js       # Axios client + all API calls
│   │   └── store/           # Zustand auth store
│   └── package.json
└── prompts/
    └── system_prompt.md    # System prompt PEERWISE Agent
```

---

## Setup & Menjalankan

### Prasyarat
- Python 3.11+
- Node.js 18+
- Gemini API Key ([dapatkan gratis di aistudio.google.com](https://aistudio.google.com/apikey))

---

### 1. Backend Setup

```bash
cd backend

# Buat virtual environment
python -m venv venv

# Aktifkan (Windows)
venv\Scripts\activate
# Aktifkan (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Buat file .env dari template
copy .env.example .env     # Windows
# cp .env.example .env     # Mac/Linux

# Edit .env — isi GEMINI_API_KEY dengan key kamu
# GEMINI_API_KEY=AIza...
# GEMINI_MODEL=gemini-2.5-flash

# Jalankan server
uvicorn main:app --reload --port 8000
```

Backend berjalan di: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

Seed data (12 tutor + 1 student demo) otomatis dibuat saat pertama kali jalan.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Frontend berjalan di: `http://localhost:5173`

> Vite proxy sudah dikonfigurasi — semua request `/api/*` di-forward ke `http://localhost:8000/*`

---

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Student | `mahasiswa@demo.com` | `demo1234` |
| Tutor | `rina.aulia@demo.com` | `demo1234` |
| Tutor | `fajar.nugroho@demo.com` | `demo1234` |
| Tutor | `bagas.wijaya@demo.com` | `demo1234` |

---

## Skenario Demo Capstone

### Skenario Lengkap: Student → Tutor → Evaluasi

**Langkah 1: Login sebagai Student**
- Buka `http://localhost:5173`
- Login dengan `mahasiswa@demo.com / demo1234`
- Atau klik tombol "Isi sebagai Student" di halaman login

**Langkah 2: AI Chat — Minta Bantuan Kalkulus**

Di halaman AI Chat, ketik:
```
Aku susah banget sama Kalkulus Integral, terutama substitusi trigonometri. 
Anggaran max Rp30.000, mau yang offline sekitar kampus, bisa Senin atau Rabu.
```

Agent akan:
1. Merespons dan mungkin menggali info tambahan (deadline, tingkat pemahaman)
2. Memanggil `search_tutors` → weighted scoring di backend
3. Menampilkan **3 kartu tutor** dengan skor, harga, jadwal, dan alasan

**Langkah 3: Pesan Tutor**
- Di kartu tutor **Rina Aulia** (Skor tertinggi, Rp25.000, offline, spesialis Kalkulus Integral)
- Pilih jadwal: `Senin 16:00-19:00`
- Klik **"📅 Pesan Tutor Ini"**
- Konfirmasi booking muncul

**Langkah 4: Tutor Terima Booking**
- Di tab baru, login sebagai `rina.aulia@demo.com / demo1234`
- Buka halaman **Permintaan Booking**
- Klik **✅ Terima** pada permintaan dari Budi Santoso
- Klik **+ Generate Learning Brief** → AI membuat brief terstruktur

**Langkah 5: Tandai Sesi Selesai (sebagai Student)**
- Kembali ke akun student
- Buka **Booking Saya**
- Klik **✅ Tandai Selesai**

**Langkah 6: Evaluasi Pasca Sesi**
- Klik **📝 Mulai Evaluasi** → AI generate 5 soal Kalkulus Integral
- Jawab semua soal
- Klik **📊 Lihat Hasil & Laporan**

**Hasil:**
```
Post-Class Learning Report
Skor: 40 → 80 (+40)
Topik dikuasai: Substitusi sederhana, Integral parsial dasar
Topik perlu diperkuat: Substitusi trigonometri lanjut
Rekomendasi: Fokus pada soal latihan substitusi trig dengan panduan tutor
```

---

## Logika Matching (Scoring Engine)

File: [`backend/app/core/scoring.py`](backend/app/core/scoring.py)

```
Skor Total (0-100) = 
  Kecocokan Materi  × 35% +  (mata kuliah + topik spesifik)
  Kompetensi Tutor  × 25% +  (semester + verifikasi)
  Kesesuaian Jadwal × 15% +  (fuzzy match hari/waktu)
  Kesesuaian Harga  × 15% +  (dalam anggaran = lebih tinggi)
  Rating & Pengalaman × 10%
```

**Peran LLM:**
- Input: memahami kebutuhan dari bahasa sehari-hari → parameter terstruktur
- Output: menjelaskan hasil ranking dalam bahasa natural yang hangat

LLM **tidak** menentukan ranking — backend Python yang melakukannya.

---

## AI Tools (Tool Calling)

| Tool | Kapan Dipanggil |
|------|----------------|
| `search_tutors(params)` | Setelah kebutuhan student terkumpul |
| `book_tutor(tutor_id, slot, ...)` | Setelah student konfirmasi pilihan |
| `generate_learning_brief(booking_id)` | Setelah booking diterima tutor |
| `generate_evaluation(booking_id)` | Setelah sesi selesai |
| `generate_report(booking_id, answers)` | Setelah student submit jawaban |

---

## Seed Data Tutor

| # | Nama | Mata Kuliah | Topik Utama | Harga | Mode | Rating |
|---|------|-------------|-------------|-------|------|--------|
| 1 | Rina Aulia | Matematika | Kalkulus Integral | Rp25.000 | Offline | ⭐4.8 |
| 2 | Dimas Pratama | Matematika | Kalkulus Diferensial & Integral | Rp30.000 | Online | ⭐4.6 |
| 3 | Salsa Maharani | Matematika | Kalkulus, Aljabar Linear | Rp20.000 | Offline | ⭐4.3 |
| 4 | Fajar Nugroho | Informatika | Struktur Data | Rp30.000 | Online | ⭐4.9 |
| 5 | Nadia Putri | Informatika | Algoritma & Pemrograman | Rp25.000 | Both | ⭐4.5 |
| 6 | Bagas Wijaya | Statistika | Statistika, Probabilitas | Rp30.000 | Online | ⭐4.7 |
| 7 | Citra Lestari | Akuntansi | Akuntansi Dasar | Rp25.000 | Offline | ⭐4.4 |
| 8 | Arif Hidayat | Matematika | Kalkulus Integral, Statistika | Rp35.000 | Online | ⭐4.9 |
| 9 | Dewi Rahmawati | Informatika | Algoritma Lanjut | Rp28.000 | Both | ⭐4.6 |
| 10 | Rizky Firmansyah | Statistika | Statistika Inferensial | Rp25.000 | Offline | ⭐4.3 |
| 11 | Amel Kartika | Akuntansi | Akuntansi Biaya & Manajemen | Rp30.000 | Online | ⭐4.5 |
| 12 | Hendra Saputra | Informatika | Pemrograman Dasar | Rp20.000 | Both | ⭐4.2 |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Router |
| Backend | Python FastAPI, SQLAlchemy, SQLite |
| AI | Gemini 2.5 Flash (OpenAI-compatible endpoint), Tool Calling |
| Auth | JWT (python-jose), bcrypt (passlib) |

---

*PEERWISE AI — Capstone Project Demo*
