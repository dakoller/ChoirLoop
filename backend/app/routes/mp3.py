# """MP3 generation and download endpoints"""
# from fastapi import APIRouter, HTTPException, status, BackgroundTasks
# from fastapi.responses import FileResponse
# from pydantic import BaseModel, Field
# from typing import Optional, Dict
# from uuid import UUID

# from app.mp3_generator import MP3GeneratorService

# router = APIRouter()


# class MP3GenerateRequest(BaseModel):
#     """Request model for MP3 generation"""
#     tempo: int = Field(default=100, ge=50, le=150, description="Tempo percentage (50-150)")
#     track_volumes: Dict[str, int] = Field(default_factory=dict, description="Track volumes in dB (-60 to 0)")
#     enabled_tracks: Dict[str, bool] = Field(default_factory=dict, description="Enabled/disabled tracks")
#     section_id: Optional[UUID] = Field(None, description="Practice section ID to render")
#     start_measure: Optional[int] = Field(None, description="Start measure for custom section")
#     start_beat: Optional[int] = Field(None, description="Start beat for custom section")
#     end_measure: Optional[int] = Field(None, description="End measure for custom section")
#     end_beat: Optional[int] = Field(None, description="End beat for custom section")


# @router.post("/{id}/generate-mp3", response_model=dict)
# async def generate_mp3(id: UUID, request: MP3GenerateRequest, background_tasks: BackgroundTasks):
#     """Generate MP3 file with specified settings"""
#     try:
#         # Convert string keys to integers for track volumes and enabled tracks
#         track_volumes = {int(k): v for k, v in request.track_volumes.items()}
#         enabled_tracks = {int(k): v for k, v in request.enabled_tracks.items()}
#         
#         # Generate settings hash
#         settings_hash = MP3GeneratorService.generate_settings_hash(
#             id,
#             request.tempo,
#             track_volumes,
#             enabled_tracks,
#             request.section_id,
#             request.start_measure,
#             request.start_beat,
#             request.end_measure,
#             request.end_beat
#         )
#         
#         # Check if MP3 already exists
#         existing_mp3 = MP3GeneratorService.get_cached_mp3_path(settings_hash)
#         if existing_mp3:
#             return {
#                 "message": "MP3 already exists",
#                 "settings_hash": settings_hash,
#                 "cached": True
#             }
#         
#         # Generate MP3 asynchronously
#         mp3_path = await MP3GeneratorService.generate_mp3(
#             id,
#             request.tempo,
#             track_volumes,
#             enabled_tracks,
#             request.section_id,
#             request.start_measure,
#             request.start_beat,
#             request.end_measure,
#             request.end_beat
#         )
#         
#         return {
#             "message": "MP3 generated successfully",
#             "settings_hash": settings_hash,
#             "cached": False
#         }
#     
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"MP3 generation failed: {str(e)}"
#         )


# @router.get("/{id}/download-mp3/{settings_hash}")
# async def download_mp3(id: UUID, settings_hash: str):
#     """Download generated MP3 file"""
#     mp3_path = MP3GeneratorService.get_cached_mp3_path(settings_hash)
#     
#     if not mp3_path:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="MP3 file not found. Generate it first."
#         )
#     
#     # Get song name for filename
#     from app.storage import StorageService
#     song = StorageService.load_song(id)
#     filename = f"{song.title if song else 'song'}_{settings_hash[:8]}.mp3"
#     
#     return FileResponse(
#         path=str(mp3_path),
#         media_type="audio/mpeg",
#         filename=filename
#     )
