# Current Task

## Current Objective
Data persistence issue fixed - songs now persist correctly after container restarts.

## Context
- Project is a browser-based tool for choir practice with MIDI file support
- Uses file-based storage (JSON) instead of database
- **Backend: Laravel (PHP)** - Full-featured framework with API resources
- **Frontend: React with Vite** - Component-based UI with fast build tooling
- Key feature: Individual voice control with practice sections and loop functionality
- Target: Progressive Web App (PWA) for offline use

## Completed Steps
1. ✅ Read claude.md specification file
2. ✅ Created architecture_docs folder and all documentation
3. ✅ Set up Docker development environment (Dockerfile, docker-compose.yml)
4. ✅ Installed and configured Laravel backend in Docker
5. ✅ Installed Laravel Sanctum
6. ✅ Configured CORS for React frontend
7. ✅ Created React frontend with Vite
8. ✅ Installed core dependencies (react-router-dom, axios, tone, zustand)
9. ✅ Implemented SongController with full CRUD and file uploads
10. ✅ Implemented PracticeSectionController
11. ✅ Created API routes for all endpoints
12. ✅ Created React components:
    - SongList (list and detail views)
    - FileUpload (MIDI, PDF, MP3)
    - PracticeSections (create/delete sections)
    - AudioPlayer (basic placeholder with Tone.js)
13. ✅ Integrated all components into working application
14. ✅ Created data/ storage structure

## Current Status
**Phase 1 MVP is functionally complete!** The application has:
- Full song management (create, view, edit, delete)
- File upload capability (MIDI, PDF, MP3)
- Practice sections management
- Basic audio player framework with Tone.js
- Both backend and frontend running and communicating

## Next Steps
1. **MIDI Parsing & Voice Extraction**
   - Install/implement PHP MIDI parser library
   - Parse MIDI tracks on upload
   - Extract voice information automatically
   - Store track-to-voice mapping

2. **Advanced Audio Player**
   - Parse uploaded MIDI files with Tone.js
   - Implement multi-track playback
   - Individual volume control per voice
   - Practice section looping with count-in
   - Three practice modes implementation

3. **Voice Configuration UI**
   - Component to map MIDI tracks to voice names
   - Voice selection dropdown for users
   - Volume mixer for each voice

4. **PDF Score Viewer**
   - Integrate react-pdf
   - Display uploaded score alongside player
   - Optional: sync scrolling with playback

5. **Refinements**
   - Better error handling
   - Loading states
   - Responsive design improvements
   - User preferences storage (localStorage)

## Related Documents
- Specification: claude.md (German specification in project root)
- Roadmap: architecture_docs/projectRoadmap.md (Phase-based development plan)

## Key Technical Considerations
- File-based storage structure: `/data/songs/{song-id}/` with song.mid, config.json, etc.
- MIDI parsing needed on both backend (PHP) and frontend (JavaScript with Tone.js)
- Volume controls must be set before playback (not adjustable during playback per spec)
- iOS compatibility concerns: May need MP3 fallback for Safari mobile
