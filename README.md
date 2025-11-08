# ChoirLoop - Choir Practice Tool

A browser-based practice tool for choirs that enables choir members to practice from MIDI files with individual voice control, practice sections, and loop functionality.

## Getting Started with Docker

This project uses Docker for local development. The PHP backend runs in a Docker container, making it easy to develop locally and then deploy to your web hoster.

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

### Starting the Development Environment

1. **Build and start the Docker container:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Backend API: http://localhost:8080
   - The container will automatically reload when you make changes to PHP files

3. **View logs:**
   ```bash
   docker-compose logs -f php-app
   ```

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Container Details

- **PHP Version:** 8.2
- **Web Server:** Apache
- **Port:** 8080 (maps to container port 80)
- **Document Root:** `/backend/public` (will be created in project setup)

### Installing PHP Dependencies

When you add Composer dependencies, run commands inside the container:

```bash
# Enter the container
docker-compose exec php-app bash

# Inside the container, navigate to backend directory
cd backend

# Install dependencies
composer install

# Exit the container
exit
```

### File Structure

```
/
├── backend/           # PHP backend code (to be created)
├── frontend/          # JavaScript frontend (to be created)
├── data/              # File-based storage for songs
├── architecture_docs/ # Project documentation
├── Dockerfile         # Docker image configuration
├── docker-compose.yml # Docker compose configuration
└── claude.md          # Original project specification (German)
```

### Deploying to Web Hoster

When ready to deploy:

1. Copy the contents of the `backend/` directory to your web hoster
2. Copy the `data/` directory (with your uploaded songs)
3. Ensure your web hoster's document root points to `backend/public`
4. Make sure PHP 8.0+ is available on your web hoster

## Development Status

**Current Phase:** Project Initialization - Documentation & Docker Setup Complete

See `architecture_docs/projectRoadmap.md` for the complete development plan.

## Documentation

- **Project Roadmap:** `architecture_docs/projectRoadmap.md` - Phase-based development plan
- **Current Task:** `architecture_docs/currentTask.md` - Current objectives and next steps
- **Architecture:** `architecture_docs/architecture.md` - Technology stack and decisions
- **Codebase Summary:** `architecture_docs/codebaseSummary.md` - Project structure overview
- **Original Spec:** `claude.md` - German language specification

## Technology Stack

- **Backend**: Laravel (PHP 8.2) - Full-featured framework with API resources
- **Frontend**: React with Vite - Component-based UI with fast build tooling
- **MIDI Playback**: Tone.js
- **Build Tool**: Vite
- **State Management**: React Context API or Zustand

## Next Steps

1. Install Laravel and React (see `SETUP.md`)
2. Create Laravel controllers and API routes
3. Build React components for UI
4. Implement MIDI file upload functionality
5. Integrate Tone.js for audio playback
6. Create basic playback with single voice control

For detailed setup instructions, see **`SETUP.md`**

## License

TBD
