"""
PEERWISE AI - FastAPI Backend Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.models.database import Base, engine
from app.core.seed import seed_database
from app.routers import auth, tutors, bookings, chat, evaluations, briefs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title="PEERWISE AI API",
    description="Platform tutoring peer-to-peer antar mahasiswa dengan AI Agent",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(tutors.router)
app.include_router(bookings.router)
app.include_router(chat.router)
app.include_router(evaluations.router)
app.include_router(briefs.router)


@app.get("/")
def root():
    return {
        "app": "PEERWISE AI",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
