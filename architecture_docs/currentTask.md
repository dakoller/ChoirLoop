# Current Task

## Current Objective
Set up initial project structure and documentation for ChoirLoop choir practice tool.

## Context
- Project is a browser-based tool for choir practice with MIDI file support
- Uses file-based storage (JSON) instead of database
- **Backend: Laravel (PHP)** - Full-featured framework with API resources
- **Frontend: React with Vite** - Component-based UI with fast build tooling
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
1. Install Laravel in the Docker container
   - Run `composer create-project laravel/laravel backend` inside container
   - Configure Laravel for file-based storage
   - Set up API routes structure
2. Set up React frontend with Vite
   - Create frontend/ directory
   - Initialize Vite React project
   - Install core dependencies (react-router-dom, tone.js, axios)
3. Configure CORS between Laravel API and React frontend
4. Create data/ folder structure for song storage
5. Begin Phase 1 MVP implementation:
   - Laravel: File upload API endpoint
   - Laravel: MIDI parsing service
   - Laravel: Song management API
   - React: File upload component
   - React: Audio player with Tone.js integration
   - React: Basic playback with single voice control

## Related Documents
- Specification: claude.md (German specification in project root)
- Roadmap: architecture_docs/projectRoadmap.md (Phase-based development plan)

## Key Technical Considerations
- File-based storage structure: `/data/songs/{song-id}/` with song.mid, config.json, etc.
- MIDI parsing needed on both backend (PHP) and frontend (JavaScript with Tone.js)
- Volume controls must be set before playback (not adjustable during playback per spec)
- iOS compatibility concerns: May need MP3 fallback for Safari mobile
