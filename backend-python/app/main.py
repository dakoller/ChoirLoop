"""
ChoirLoop FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routes import songs, health, files, sections

# Initialize FastAPI app
app = FastAPI(
    title="ChoirLoop API",
    description="API for choir practice with MIDI file support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://choirloop.rosakehlchen.de"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(songs.router, prefix="/api/songs", tags=["songs"])
app.include_router(files.router, prefix="/api/songs", tags=["files"])
app.include_router(sections.router, prefix="/api/songs", tags=["sections"])

# Ensure data directory exists
DATA_DIR = Path("../data")
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "songs").mkdir(exist_ok=True)

# Create index.json if it doesn't exist
index_file = DATA_DIR / "index.json"
if not index_file.exists():
    index_file.write_text("[]")

@app.get("/")
async def root():
    return {"message": "ChoirLoop API - Use /api endpoints"}
