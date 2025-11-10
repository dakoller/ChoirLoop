"""
MP3 Generation Service for ChoirLoop
Converts MIDI files to MP3 with specific voice mix and tempo settings
"""
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Dict, Optional, List
from uuid import UUID
import mido
from pydub import AudioSegment

from app.storage import StorageService

MP3_CACHE_DIR = Path("/app/data/mp3_cache") if Path("/app/data").exists() else Path("../data/mp3_cache")


class MP3GeneratorService:
    """Handle MP3 generation from MIDI files with custom settings"""
    
    @staticmethod
    def ensure_cache_dir():
        """Ensure MP3 cache directory exists"""
        MP3_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def generate_settings_hash(
        song_id: UUID,
        tempo: int,
        track_volumes: Dict[int, int],
        enabled_tracks: Dict[int, bool],
        section_id: Optional[UUID] = None,
        start_measure: Optional[int] = None,
        start_beat: Optional[int] = None,
        end_measure: Optional[int] = None,
        end_beat: Optional[int] = None
    ) -> str:
        """Generate unique hash for MP3 settings combination"""
        settings = {
            "song_id": str(song_id),
            "tempo": tempo,
            "track_volumes": track_volumes,
            "enabled_tracks": enabled_tracks,
            "section_id": str(section_id) if section_id else None,
            "start_measure": start_measure,
            "start_beat": start_beat,
            "end_measure": end_measure,
            "end_beat": end_beat
        }
        
        settings_json = json.dumps(settings, sort_keys=True)
        return hashlib.sha256(settings_json.encode()).hexdigest()
    
    @staticmethod
    async def generate_mp3(
        song_id: UUID,
        tempo: int = 100,
        track_volumes: Optional[Dict[int, int]] = None,
        enabled_tracks: Optional[Dict[int, bool]] = None,
        section_id: Optional[UUID] = None,
        start_measure: Optional[int] = None,
        start_beat: Optional[int] = None,
        end_measure: Optional[int] = None,
        end_beat: Optional[int] = None
    ) -> Path:
        """
        Generate MP3 file from MIDI with specified settings
        Returns path to generated MP3 file
        """
        MP3GeneratorService.ensure_cache_dir()
        
        # Generate hash for these settings
        settings_hash = MP3GeneratorService.generate_settings_hash(
            song_id, tempo, track_volumes or {}, enabled_tracks or {},
            section_id, start_measure, start_beat, end_measure, end_beat
        )
        
        # Check if MP3 already exists in cache
        cached_mp3 = MP3_CACHE_DIR / f"{settings_hash}.mp3"
        if cached_mp3.exists():
            print(f"[MP3Generator] Using cached MP3: {settings_hash}")
            return cached_mp3
        
        print(f"[MP3Generator] Generating new MP3: {settings_hash}")
        
        # Load song and MIDI file
        song = StorageService.load_song(song_id)
        if not song or not song.midi_file:
            raise ValueError("Song or MIDI file not found")
        
        midi_path = StorageService.get_song_dir(song_id) / song.midi_file
        if not midi_path.exists():
            raise ValueError("MIDI file not found on disk")
        
        # Create modified MIDI with volume adjustments and section trimming
        modified_midi_path = MP3_CACHE_DIR / f"{settings_hash}_temp.mid"
        MP3GeneratorService.create_modified_midi(
            midi_path,
            modified_midi_path,
            tempo,
            track_volumes or {},
            enabled_tracks or {},
            start_measure,
            start_beat,
            end_measure,
            end_beat
        )
        
        # Convert MIDI to WAV using FluidSynth
        wav_path = MP3_CACHE_DIR / f"{settings_hash}_temp.wav"
        soundfont = "/usr/share/sounds/sf2/FluidR3_GM.sf2"  # Default soundfont
        
        try:
            subprocess.run([
                "fluidsynth",
                "-ni",  # No interactive mode
                soundfont,
                modified_midi_path,
                "-F", str(wav_path),
                "-r", "44100"  # Sample rate
            ], check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"[MP3Generator] FluidSynth error: {e.stderr.decode()}")
            raise ValueError(f"MIDI to WAV conversion failed: {e.stderr.decode()}")
        
        # Convert WAV to MP3 using pydub (which uses ffmpeg)
        try:
            audio = AudioSegment.from_wav(str(wav_path))
            audio.export(str(cached_mp3), format="mp3", bitrate="192k")
        except Exception as e:
            print(f"[MP3Generator] WAV to MP3 conversion error: {e}")
            raise ValueError(f"WAV to MP3 conversion failed: {str(e)}")
        
        # Cleanup temporary files
        modified_midi_path.unlink(missing_ok=True)
        wav_path.unlink(missing_ok=True)
        
        print(f"[MP3Generator] MP3 generated successfully: {cached_mp3}")
        return cached_mp3
    
    @staticmethod
    def create_modified_midi(
        source_midi: Path,
        dest_midi: Path,
        tempo_percent: int,
        track_volumes: Dict[int, int],
        enabled_tracks: Dict[int, bool],
        start_measure: Optional[int] = None,
        start_beat: Optional[int] = None,
        end_measure: Optional[int] = None,
        end_beat: Optional[int] = None
    ):
        """Create a modified MIDI file with tempo and volume adjustments"""
        mid = mido.MidiFile(str(source_midi))
        
        # Adjust tempo
        tempo_multiplier = 100 / tempo_percent
        
        # Create new MIDI file
        new_mid = mido.MidiFile()
        new_mid.ticks_per_beat = mid.ticks_per_beat
        
        for track_idx, track in enumerate(mid.tracks):
            new_track = mido.MidiTrack()
            
            # Check if this track should be included
            is_enabled = enabled_tracks.get(track_idx, True)
            volume_db = track_volumes.get(track_idx, -10) if is_enabled else -100
            
            # Convert dB to MIDI velocity multiplier (approximate)
            # -60dB = 0, 0dB = 1.0
            velocity_multiplier = max(0, min(1, 10 ** (volume_db / 20)))
            
            for msg in track:
                new_msg = msg.copy()
                
                # Adjust tempo in meta messages
                if msg.type == 'set_tempo':
                    new_msg = mido.MetaMessage('set_tempo', 
                        tempo=int(msg.tempo * tempo_multiplier),
                        time=msg.time
                    )
                
                # Adjust note velocity for volume
                elif msg.type == 'note_on' and hasattr(msg, 'velocity'):
                    new_velocity = int(msg.velocity * velocity_multiplier)
                    new_msg = msg.copy(velocity=new_velocity)
                
                new_track.append(new_msg)
            
            new_mid.tracks.append(new_track)
        
        # Save modified MIDI
        new_mid.save(str(dest_midi))
    
    @staticmethod
    def get_cached_mp3_path(settings_hash: str) -> Optional[Path]:
        """Get path to cached MP3 if it exists"""
        cached_mp3 = MP3_CACHE_DIR / f"{settings_hash}.mp3"
        return cached_mp3 if cached_mp3.exists() else None
