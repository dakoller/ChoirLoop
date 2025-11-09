"""
Pydantic models for ChoirLoop API
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID, uuid4


class Voice(BaseModel):
    """Voice/track information from MIDI file"""
    track_number: int = Field(..., description="MIDI track number (0-indexed)")
    name: str = Field(..., description="Voice name (e.g., Soprano, Alto)")
    channel: Optional[int] = Field(None, description="MIDI channel")
    note_count: int = Field(..., description="Number of notes in track")


class PracticeSection(BaseModel):
    """Practice section within a song"""
    id: UUID = Field(default_factory=uuid4)
    label: str = Field(..., description="Section label (e.g., Chorus, Verse 1)")
    start_measure: int = Field(..., ge=1, description="Starting measure")
    start_beat: int = Field(..., ge=1, description="Starting beat")
    end_measure: int = Field(..., ge=1, description="Ending measure")
    end_beat: int = Field(..., ge=1, description="Ending beat")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SongBase(BaseModel):
    """Base song model for creation/update"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default="", max_length=1000)


class SongCreate(SongBase):
    """Model for creating a new song"""
    pass


class SongUpdate(BaseModel):
    """Model for updating a song"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class Song(SongBase):
    """Complete song model"""
    id: UUID
    midi_file: Optional[str] = None
    score_file: Optional[str] = None
    voices: List[Voice] = Field(default_factory=list)
    practice_sections: List[PracticeSection] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "ecb12847-edae-4c3e-b743-d4337c63cb5b",
                "title": "Ave Maria",
                "description": "Choir practice",
                "midi_file": "song.mid",
                "score_file": "score.xml",
                "voices": [
                    {
                        "track_number": 0,
                        "name": "Soprano",
                        "channel": 1,
                        "note_count": 245
                    }
                ],
                "practice_sections": [],
                "created_at": "2025-11-08T20:00:00Z",
                "updated_at": "2025-11-08T22:20:28Z"
            }
        }


class SongSummary(BaseModel):
    """Summary song model for list view"""
    id: UUID
    title: str
    description: str
    updated_at: datetime


class PracticeSectionCreate(BaseModel):
    """Model for creating a practice section"""
    label: str = Field(..., min_length=1)
    start_measure: int = Field(..., ge=1)
    start_beat: int = Field(..., ge=1)
    end_measure: int = Field(..., ge=1)
    end_beat: int = Field(..., ge=1)


class PracticeSectionUpdate(BaseModel):
    """Model for updating a practice section"""
    label: Optional[str] = Field(None, min_length=1)
    start_measure: Optional[int] = Field(None, ge=1)
    start_beat: Optional[int] = Field(None, ge=1)
    end_measure: Optional[int] = Field(None, ge=1)
    end_beat: Optional[int] = Field(None, ge=1)
