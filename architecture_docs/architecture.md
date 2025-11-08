# Architecture & Technology Stack

## Technology Decisions

### Backend
- **Language**: PHP (version 8.2)
- **Framework**: Laravel (latest version)
  - Full-featured framework with excellent ecosystem
  - Built-in routing, middleware, validation
  - Eloquent ORM (though using file-based storage)
  - Easy API development with API resources
- **MIDI Parsing**: php-midi-parser library or equivalent
- **File Operations**: Laravel's Storage facade for file management

### Frontend
- **Framework**: React (latest version)
  - Component-based architecture
  - Large ecosystem with extensive libraries
  - React Router for navigation
  - State management: React Context API or Zustand
- **Build Tool**: Vite (fast, modern build tool)
- **MIDI Playback**: Tone.js (robust timing and MIDI support)
- **PDF Display**: react-pdf or PDF.js
- **MusicXML (Phase 3)**: OpenSheetMusicDisplay or Verovio
- **PWA Support**: Vite PWA plugin for Service Workers

### Data Storage
- **Primary**: File-based JSON storage
- **Structure**: 
  ```
  /data
    /songs
      /song-{uuid}
        - song.mid
        - score.pdf (optional)
        - config.json (metadata, voices, practice sections)
        - tenor1.mp3 (optional, for iOS)
        - tenor2.mp3 (optional)
    /index.json (list of all songs)
  ```
- **Session Storage**: Browser localStorage for user preferences (volume, tempo, voice selection)

### Browser Compatibility
- **Primary Targets**: Chrome, Firefox, Safari (desktop and mobile)
- **Critical**: Mobile Safari (iOS) - may require MP3 fallback due to MIDI limitations
- **Web APIs Used**:
  - Web Audio API
  - Web MIDI API (with fallback)
  - File API
  - Service Workers (PWA)

## Architecture Patterns

### Backend Architecture
- RESTful API endpoints for CRUD operations
- File-based storage with UUID-based song directories
- MIDI parsing on upload to extract track information
- JSON configuration files for song metadata

### Frontend Architecture
- Component-based structure (regardless of framework choice)
- State management for:
  - Current song
  - Selected voice
  - Volume settings
  - Practice section selection
  - Playback state
- Audio engine abstraction layer (for MIDI/MP3 switching)

## API Endpoints (Planned)

### Songs
- `GET /api/songs` - List all songs
- `GET /api/songs/{id}` - Get song details
- `POST /api/songs` - Create new song (upload MIDI)
- `PUT /api/songs/{id}` - Update song metadata
- `DELETE /api/songs/{id}` - Delete song

### Practice Sections
- `GET /api/songs/{id}/sections` - Get all practice sections
- `POST /api/songs/{id}/sections` - Create practice section
- `PUT /api/songs/{id}/sections/{sectionId}` - Update section
- `DELETE /api/songs/{id}/sections/{sectionId}` - Delete section

### Files
- `POST /api/songs/{id}/upload/midi` - Upload MIDI file
- `POST /api/songs/{id}/upload/score` - Upload PDF score
- `POST /api/songs/{id}/upload/mp3` - Upload MP3 track

## Security Considerations
- File upload validation (MIME types, size limits)
- Directory traversal prevention
- Input sanitization for song metadata
- XSS prevention in frontend
- CSRF protection for state-changing operations

## Performance Considerations
- Lazy loading of song data
- Audio preloading for smooth playback
- Service Worker caching for offline use
- Optimized JSON parsing
- Efficient MIDI file handling

## Technical Debt Tracking

### Current Technical Debt
- None yet (project initialization phase)

### Future Considerations
- Migration path from file-based to database storage if needed
- Scaling strategy for large number of songs
- Multi-user authentication system
- Advanced caching strategies

## Development Environment
- **Version Control**: Git
- **Development Setup**: Docker containers for local development
  - PHP backend in Docker container
  - Code deployment to web hoster via direct copy
- **Package Management**: 
  - Backend: Composer (PHP)
  - Frontend: npm or yarn
- **Build Tools**: TBD based on framework choice
- **Testing**: TBD (PHPUnit for backend, Jest/Vitest for frontend)
