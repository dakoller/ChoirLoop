# Codebase Summary

## Project Overview
**ChoirLoop** is a browser-based choir practice tool that enables choir members to practice MIDI songs with individual voice control, practice sections, and loop functionality.

**Current Phase**: Project Initialization - Documentation Setup Complete

## Project Structure

Currently, the project only contains specification and documentation:

```
/
├── claude.md                      # Original German specification
├── architecture_docs/             # Project documentation
│   ├── projectRoadmap.md         # Phase-based development roadmap
│   ├── currentTask.md            # Current objectives and next steps
│   ├── architecture.md           # Technology stack and architecture decisions
│   └── codebaseSummary.md        # This file
```

### Planned Structure (To Be Created)

```
/
├── backend/                       # PHP backend
│   ├── api/                      # API endpoints
│   ├── src/                      # Source code
│   │   ├── Parser/               # MIDI parsing
│   │   ├── Storage/              # File operations
│   │   └── Models/               # Data models
│   ├── composer.json             # PHP dependencies
│   └── public/                   # Public entry point
├── frontend/                      # JavaScript frontend
│   ├── src/                      # Source code
│   │   ├── components/           # UI components
│   │   ├── services/             # API & audio services
│   │   ├── stores/               # State management
│   │   └── utils/                # Utility functions
│   ├── public/                   # Static assets
│   └── package.json              # Node dependencies
├── data/                          # File-based storage
│   ├── songs/                    # Song directories
│   │   └── {song-uuid}/          # Individual song folders
│   │       ├── song.mid
│   │       ├── config.json
│   │       └── score.pdf (optional)
│   └── index.json                # Song index
└── docs/                          # Additional documentation
```

## Key Components and Their Interactions

### Not Yet Implemented
The following components are planned but not yet created:

1. **Backend API Layer**
   - RESTful endpoints for song management
   - File upload handling
   - MIDI parsing service
   - JSON-based data persistence

2. **Frontend Application**
   - Song selection and management interface
   - Audio player with Tone.js
   - Volume mixer for individual voices
   - Practice section playlist
   - Admin interface for choir leaders

3. **Audio Engine**
   - MIDI playback using Tone.js
   - Multi-track volume control
   - Tempo adjustment (50%-150%)
   - Loop functionality with count-in
   - MP3 fallback for iOS

## Data Flow

### Planned Data Flow
1. **Song Upload**: Choir leader uploads MIDI → Backend parses tracks → Creates song directory with config.json
2. **Practice Setup**: Choir leader defines practice sections → Stored in config.json
3. **Member Practice**: Member selects song & voice → Frontend loads MIDI → User adjusts settings → Playback with loop

## External Dependencies

### Backend (Planned)
- PHP 8.0+
- php-midi-parser (or equivalent)
- Composer for dependency management

### Frontend (Planned)
- Tone.js (MIDI playback and audio synthesis)
- PDF.js (sheet music display)
- Modern browser APIs (Web Audio, Service Workers)

### Future Considerations
- OpenSheetMusicDisplay or Verovio (MusicXML support, Phase 3)
- PWA libraries for offline functionality

## Recent Significant Changes

### 2025-01-08
- ✅ Project initialization
- ✅ Documentation structure created
- ✅ Specification analyzed (claude.md)
- ✅ Essential architecture documents created:
  - projectRoadmap.md
  - currentTask.md
  - architecture.md
  - codebaseSummary.md

## User Feedback Integration

### Current Status
No user feedback yet - project in initialization phase.

### Feedback Mechanism (To Be Implemented)
- Direct communication for specification clarifications
- Issue tracking for bugs and feature requests
- Iterative development based on choir director and member testing

## Development Priorities

### Immediate Next Steps (Phase 1 MVP)
1. Choose and set up backend framework (Laravel/Slim/Vanilla PHP)
2. Choose and set up frontend framework (React/Vue/Vanilla JS)
3. Create basic project structure
4. Implement file upload functionality
5. Implement MIDI parsing
6. Create basic playback with single voice
7. Implement loop functionality

### Technical Decisions Pending
- Backend framework selection
- Frontend framework selection
- Specific PHP MIDI parsing library
- Build tooling and development environment setup

## Notes
- File-based storage chosen over database for simplicity and portability
- iOS compatibility requires special attention (potential MP3 fallback)
- Volume controls must be set before playback (per specification)
- PWA functionality deferred to Phase 3
