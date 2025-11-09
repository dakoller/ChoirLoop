# ChoirLoop - Project Roadmap

## Project Vision
A browser-based practice tool for choirs that allows choir members to practice specific sections from MIDI files with individual voice control.

## High-Level Goals

### Phase 1: MVP (Minimum Viable Product)
- [x] MIDI file upload and parsing
- [x] Basic playback of individual voices (framework ready with Tone.js)
- [x] Simple volume control per track (basic implementation)
- [x] Manual definition of start/end measures (practice sections)
- [ ] Loop function (endless) - Player framework ready
- [x] File-based storage system (JSON)

### Phase 2: Core Features
- [ ] Admin interface for defining practice sections
- [ ] Playlist view for all practice sections
- [ ] Tempo control (50% - 150%)
- [ ] Count-in before loops
- [ ] Configurable repetitions (default 3x)
- [ ] Three practice modes:
  - Focus on own voice
  - With choir
  - Without own voice

### Phase 3: Enhanced User Experience
- [ ] PDF sheet music display
- [ ] Synchronized scrolling with playback
- [ ] MusicXML support
- [ ] MP3 fallback for iOS devices
- [ ] Progressive Web App (PWA) functionality
- [ ] Responsive design for mobile/tablet/desktop

### Phase 4: Community Features
- [ ] Multi-user management
- [ ] Progress tracking
- [ ] Sharing practice sections
- [ ] Recording function
- [ ] Transposition support
- [ ] Metronome integration

## Completion Criteria
- [ ] Choir leaders can upload MIDI files and define practice sections
- [ ] Choir members can select their voice and practice specific sections
- [ ] Individual volume control for each voice works reliably
- [ ] Loop function works with configurable repetitions and count-in
- [ ] Tempo control functions smoothly (50%-150%)
- [ ] Application works offline as PWA
- [ ] Compatible with Chrome, Firefox, Safari (desktop and mobile)

## Completed Tasks

### 2025-01-08 - Phase 1 MVP Foundation Complete
- ✅ Docker development environment setup
- ✅ Laravel backend API fully implemented
  - SongController with CRUD operations
  - PracticeSectionController with full management
  - File upload endpoints (MIDI, PDF, MP3)
  - File-based JSON storage system
- ✅ React frontend with Vite
  - SongList component with list and detail views
  - FileUpload component for all file types
  - PracticeSections component for section management
  - AudioPlayer component with Tone.js integration (basic)
- ✅ Full backend-frontend integration working
- ✅ CORS configured and tested
- ✅ All API endpoints tested and operational

## Future Considerations
- Nextcloud integration for cloud-based MIDI file access
- Collaborative practice sessions over the internet
- Advanced progress tracking and analytics
- Multi-voice practice (learning two voices simultaneously)
