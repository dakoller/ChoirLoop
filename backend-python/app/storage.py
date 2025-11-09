"""
File-based JSON storage service for ChoirLoop
"""
import json
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from app.models import Song, SongCreate, SongUpdate, SongSummary, PracticeSection, Voice

# In Docker, data is mounted at /app/data
# Locally (outside Docker), it's in ../data
DATA_DIR = Path("/app/data") if Path("/app/data").exists() else Path("../data")
SONGS_DIR = DATA_DIR / "songs"
INDEX_FILE = DATA_DIR / "index.json"


class StorageService:
    """Handle file-based storage operations"""
    
    @staticmethod
    def ensure_directories():
        """Ensure required directories exist"""
        DATA_DIR.mkdir(exist_ok=True)
        SONGS_DIR.mkdir(exist_ok=True)
        if not INDEX_FILE.exists():
            INDEX_FILE.write_text("[]")
    
    @staticmethod
    def load_index() -> List[str]:
        """Load song index - compatible with Laravel format"""
        if not INDEX_FILE.exists():
            return []
        
        data = json.loads(INDEX_FILE.read_text())
        
        # Handle Laravel format (array of objects with 'id' field)
        if data and isinstance(data[0], dict):
            return [song['id'] for song in data]
        
        # Handle simple array of IDs
        return data
    
    @staticmethod
    def save_index(song_ids: List[str]):
        """Save song index"""
        INDEX_FILE.write_text(json.dumps(song_ids, indent=2))
    
    @staticmethod
    def get_song_dir(song_id: UUID) -> Path:
        """Get directory path for a song"""
        return SONGS_DIR / str(song_id)
    
    @staticmethod
    def get_config_file(song_id: UUID) -> Path:
        """Get config.json path for a song"""
        return StorageService.get_song_dir(song_id) / "config.json"
    
    @staticmethod
    def load_song(song_id: UUID) -> Optional[Song]:
        """Load song from storage"""
        config_file = StorageService.get_config_file(song_id)
        if not config_file.exists():
            return None
        
        data = json.loads(config_file.read_text())
        return Song(**data)
    
    @staticmethod
    def save_song(song: Song):
        """Save song to storage"""
        song_dir = StorageService.get_song_dir(song.id)
        song_dir.mkdir(parents=True, exist_ok=True)
        
        config_file = StorageService.get_config_file(song.id)
        
        # Convert to dict with proper serialization
        data = song.model_dump(mode='json')
        config_file.write_text(json.dumps(data, indent=2, default=str))
        
        # Update index
        index = StorageService.load_index()
        song_id_str = str(song.id)
        if song_id_str not in index:
            index.append(song_id_str)
            StorageService.save_index(index)
    
    @staticmethod
    def delete_song(song_id: UUID) -> bool:
        """Delete song and all its files"""
        song_dir = StorageService.get_song_dir(song_id)
        if not song_dir.exists():
            return False
        
        # Remove directory and all contents
        shutil.rmtree(song_dir)
        
        # Update index
        index = StorageService.load_index()
        song_id_str = str(song_id)
        if song_id_str in index:
            index.remove(song_id_str)
            StorageService.save_index(index)
        
        return True
    
    @staticmethod
    def list_songs() -> List[SongSummary]:
        """List all songs"""
        index = StorageService.load_index()
        songs = []
        
        for song_id_str in index:
            try:
                song = StorageService.load_song(UUID(song_id_str))
                if song:
                    songs.append(SongSummary(
                        id=song.id,
                        title=song.title,
                        description=song.description,
                        updated_at=song.updated_at
                    ))
            except Exception as e:
                print(f"Error loading song {song_id_str}: {e}")
                continue
        
        return songs
    
    @staticmethod
    def create_song(song_data: SongCreate) -> Song:
        """Create a new song"""
        song = Song(
            id=uuid4(),
            title=song_data.title,
            description=song_data.description or "",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        StorageService.save_song(song)
        return song
    
    @staticmethod
    def update_song(song_id: UUID, update_data: SongUpdate) -> Optional[Song]:
        """Update an existing song"""
        song = StorageService.load_song(song_id)
        if not song:
            return None
        
        # Update fields
        if update_data.title is not None:
            song.title = update_data.title
        if update_data.description is not None:
            song.description = update_data.description
        
        song.updated_at = datetime.utcnow()
        StorageService.save_song(song)
        return song
    
    @staticmethod
    def add_practice_section(song_id: UUID, section_data: Dict[str, Any]) -> Optional[PracticeSection]:
        """Add a practice section to a song"""
        song = StorageService.load_song(song_id)
        if not song:
            return None
        
        section = PracticeSection(**section_data)
        song.practice_sections.append(section)
        song.updated_at = datetime.utcnow()
        
        StorageService.save_song(song)
        return section
    
    @staticmethod
    def update_practice_section(
        song_id: UUID, 
        section_id: UUID, 
        update_data: Dict[str, Any]
    ) -> Optional[PracticeSection]:
        """Update a practice section"""
        song = StorageService.load_song(song_id)
        if not song:
            return None
        
        # Find section
        section = next((s for s in song.practice_sections if s.id == section_id), None)
        if not section:
            return None
        
        # Update fields
        for key, value in update_data.items():
            if value is not None and hasattr(section, key):
                setattr(section, key, value)
        
        song.updated_at = datetime.utcnow()
        StorageService.save_song(song)
        return section
    
    @staticmethod
    def delete_practice_section(song_id: UUID, section_id: UUID) -> bool:
        """Delete a practice section"""
        song = StorageService.load_song(song_id)
        if not song:
            return False
        
        # Find and remove section
        original_count = len(song.practice_sections)
        song.practice_sections = [s for s in song.practice_sections if s.id != section_id]
        
        if len(song.practice_sections) == original_count:
            return False  # Section not found
        
        song.updated_at = datetime.utcnow()
        StorageService.save_song(song)
        return True
