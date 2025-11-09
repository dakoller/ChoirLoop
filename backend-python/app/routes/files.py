"""File upload and serving endpoints"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from uuid import UUID
from pathlib import Path
import mido
from datetime import datetime

from app.storage import StorageService, SONGS_DIR
from app.models import Voice

router = APIRouter()


@router.post("/{id}/upload/midi")
async def upload_midi(id: UUID, midi_file: UploadFile = File(...)):
    """Upload MIDI file for a song"""
    song = StorageService.load_song(id)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    
    # Validate file extension
    if not midi_file.filename.lower().endswith(('.mid', '.midi')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be .mid or .midi"
        )
    
    # Save MIDI file
    song_dir = StorageService.get_song_dir(id)
    song_dir.mkdir(parents=True, exist_ok=True)
    
    midi_path = song_dir / "song.mid"
    with open(midi_path, "wb") as f:
        content = await midi_file.read()
        f.write(content)
    
    # Parse MIDI to extract voices
    try:
        mid = mido.MidiFile(str(midi_path))
        voices = []
        
        for i, track in enumerate(mid.tracks):
            notes = [msg for msg in track if msg.type == 'note_on']
            if notes:  # Only include tracks with notes
                # Get channel from first note
                channel = notes[0].channel if hasattr(notes[0], 'channel') else None
                
                voices.append(Voice(
                    track_number=i,
                    name=f"Track {i + 1}",
                    channel=channel,
                    note_count=len(notes)
                ))
        
        song.voices = voices
    except Exception as e:
        print(f"Error parsing MIDI: {e}")
        # Continue even if parsing fails
    
    song.midi_file = "song.mid"
    song.updated_at = datetime.utcnow()
    StorageService.save_song(song)
    
    return {"message": "MIDI file uploaded successfully", "midi_file": "song.mid"}


@router.post("/{id}/upload/score")
async def upload_score(id: UUID, score_file: UploadFile = File(...)):
    """Upload MusicXML score file for a song"""
    song = StorageService.load_song(id)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    
    # Validate file extension
    if not score_file.filename.lower().endswith(('.xml', '.mxl', '.musicxml')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be .xml, .mxl, or .musicxml"
        )
    
    # Save score file
    song_dir = StorageService.get_song_dir(id)
    song_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine file extension
    ext = Path(score_file.filename).suffix
    score_filename = f"score{ext}"
    score_path = song_dir / score_filename
    
    with open(score_path, "wb") as f:
        content = await score_file.read()
        f.write(content)
    
    song.score_file = score_filename
    song.updated_at = datetime.utcnow()
    StorageService.save_song(song)
    
    return {"message": "Score file uploaded successfully", "score_file": score_filename}


@router.get("/{id}/midi")
async def get_midi(id: UUID):
    """Serve MIDI file"""
    song = StorageService.load_song(id)
    if not song or not song.midi_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MIDI file not found")
    
    midi_path = StorageService.get_song_dir(id) / song.midi_file
    if not midi_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MIDI file not found")
    
    return FileResponse(
        path=str(midi_path),
        media_type="audio/midi",
        filename=song.midi_file
    )


@router.get("/{id}/score")
async def get_score(id: UUID):
    """Serve MusicXML score file"""
    song = StorageService.load_song(id)
    if not song or not song.score_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Score file not found")
    
    score_path = StorageService.get_song_dir(id) / song.score_file
    if not score_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Score file not found")
    
    # Determine media type
    if score_path.suffix == '.mxl':
        media_type = "application/vnd.recordare.musicxml"
    else:
        media_type = "application/xml"
    
    return FileResponse(
        path=str(score_path),
        media_type=media_type,
        filename=song.score_file
    )
