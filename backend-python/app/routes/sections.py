"""Practice section endpoints"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID

from app.models import PracticeSection, PracticeSectionCreate, PracticeSectionUpdate
from app.storage import StorageService

router = APIRouter()


@router.get("/{id}/sections", response_model=dict)
async def list_sections(id: UUID):
    """Get all practice sections for a song"""
    song = StorageService.load_song(id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found"
        )
    return {"sections": song.practice_sections}


@router.post("/{id}/sections", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_section(id: UUID, section_data: PracticeSectionCreate):
    """Create a new practice section"""
    section = StorageService.add_practice_section(id, section_data.model_dump())
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Song not found"
        )
    return {"section": section}


@router.put("/{id}/sections/{sectionId}", response_model=dict)
async def update_section(id: UUID, sectionId: UUID, update_data: PracticeSectionUpdate):
    """Update a practice section"""
    section = StorageService.update_practice_section(
        id, 
        sectionId, 
        update_data.model_dump(exclude_unset=True)
    )
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section or song not found"
        )
    return {"section": section}


@router.delete("/{id}/sections/{sectionId}", response_model=dict)
async def delete_section(id: UUID, sectionId: UUID):
    """Delete a practice section"""
    success = StorageService.delete_practice_section(id, sectionId)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section or song not found"
        )
    return {"message": "Section deleted successfully"}
