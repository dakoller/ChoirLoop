# Current Task

## Current Objective
Set up initial project structure and documentation for ChoirLoop choir practice tool.

## Context
- Project is a browser-based tool for choir practice with MIDI file support
- Uses file-based storage (JSON) instead of database
- Backend: PHP, Frontend: TBD (React/Vue/vanilla JS)
- Key feature: Individual voice control with practice sections and loop functionality
- Target: Progressive Web App (PWA) for offline use

## Completed Steps
1. ✅ Read claude.md specification file
2. ✅ Created architecture_docs folder
3. ✅ Created projectRoadmap.md, currentTask.md, architecture.md, codebaseSummary.md
4. ✅ Set up Docker development environment (Dockerfile, docker-compose.yml)
5. ✅ Created README.md with Docker instructions
6. ✅ Created .gitignore for project

## Next Steps
1. Choose backend framework (Laravel/Slim/Vanilla PHP)
2. Choose frontend framework (React/Vue/Vanilla JS)
3. Create backend/ directory structure
4. Create frontend/ directory structure
5. Set up data/ folder structure for song storage
6. Begin Phase 1 MVP implementation:
   - MIDI file upload capability
   - Basic file storage system
   - MIDI parsing functionality
   - Basic playback with single voice

## Related Documents
- Specification: claude.md (German specification in project root)
- Roadmap: architecture_docs/projectRoadmap.md (Phase-based development plan)

## Key Technical Considerations
- File-based storage structure: `/data/songs/{song-id}/` with song.mid, config.json, etc.
- MIDI parsing needed on both backend (PHP) and frontend (JavaScript with Tone.js)
- Volume controls must be set before playback (not adjustable during playback per spec)
- iOS compatibility concerns: May need MP3 fallback for Safari mobile
