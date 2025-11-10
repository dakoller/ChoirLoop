"""Song management endpoints"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID

from app.models import Song, SongCreate, SongUpdate, SongSummary
from app.storage import StorageService

router = APIRouter()


@router.get("", response_model=dict)
async def list_songs():
    """List all songs"""
    songs = StorageService.list_songs()
    return {"songs": songs}


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_song(song_data: SongCreate):
    """Create a new song"""
    song = StorageService.create_song(song_data)
    return {"song": song}


@router.get("/{id}", response_model=dict)
async def get_song(id: UUID):
    """Get song details"""
    song = StorageService.load_song(id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found"
        )
    return {"song": song}


@router.put("/{id}", response_model=dict)
async def update_song(id: UUID, update_data: SongUpdate):
    """Update song metadata"""
    song = StorageService.update_song(id, update_data)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found"
        )
    return {"song": song}


@router.delete("/{id}", response_model=dict)
async def delete_song(id: UUID):
    """Delete a song"""
    success = StorageService.delete_song(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found"
        )
    return {"message": "Song deleted successfully"}
