"""
Database models and SQLite setup for PEERWISE AI.
"""
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./peerwise.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "student" | "tutor"
    jurusan = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tutor_profile = relationship("TutorProfile", back_populates="user", uselist=False)
    bookings_as_student = relationship("Booking", foreign_keys="Booking.student_id", back_populates="student")


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    mata_kuliah = Column(String, nullable=False)
    topik = Column(Text, nullable=False)        # JSON array string
    semester = Column(Integer, nullable=False)
    harga_per_sesi = Column(Integer, nullable=False)
    jadwal = Column(Text, nullable=False)        # JSON array string
    mode = Column(String, nullable=False)        # online | offline | both
    lokasi = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    jumlah_sesi = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="tutor_profile")
    bookings = relationship("Booking", foreign_keys="Booking.tutor_id", back_populates="tutor")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id"))
    mata_kuliah = Column(String, nullable=False)
    topik = Column(Text, nullable=False)
    jadwal_dipilih = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    status = Column(String, default="menunggu")  # menunggu | diterima | ditolak | selesai
    catatan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id], back_populates="bookings_as_student")
    tutor = relationship("TutorProfile", foreign_keys=[tutor_id], back_populates="bookings")
    learning_brief = relationship("LearningBrief", back_populates="booking", uselist=False)
    evaluation = relationship("Evaluation", back_populates="booking", uselist=False)


class LearningBrief(Base):
    __tablename__ = "learning_briefs"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True)
    content = Column(Text, nullable=False)   # JSON: full structured brief
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="learning_brief")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True)
    questions = Column(Text, nullable=False)     # JSON array of questions
    answers = Column(Text, nullable=True)         # JSON array of student answers
    score_before = Column(Integer, nullable=True)
    score_after = Column(Integer, nullable=True)
    report = Column(Text, nullable=True)          # final post-class report JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="evaluation")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String, nullable=False)
    role = Column(String, nullable=False)         # "user" | "assistant"
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", Text, nullable=True)  # JSON extra data
    created_at = Column(DateTime, default=datetime.utcnow)
