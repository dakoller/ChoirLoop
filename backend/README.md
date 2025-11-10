# ChoirLoop Python Backend (FastAPI + uv)

This is the Python/FastAPI reimplementation of the ChoirLoop backend, designed to replace the Laravel backend.

## Features

- **FastAPI** - Modern, fast web framework
- **uv** - Fast Python package installer and resolver
- **File-based storage** - Compatible with existing data structure
- **MIDI parsing** - Using `mido` library
- **Docker-ready** - Easy deployment with Docker Compose

## Prerequisites

- Docker and Docker Compose
- Python 3.12+ (if running locally without Docker)
- uv (if running locally)

## Quick Start with Docker

### 1. Build and Run

```bash
cd backend-python
docker compose -f docker-compose.python.yml up --build
```

The API will be available at: `http://localhost:8000`

### 2. Test the API

```bash
# Health check
curl http://localhost:8000/api/health

# List songs
curl http://localhost:8000/api/songs

# API documentation (auto-generated)
open http://localhost:8000/docs
```

## Local Development (Without Docker)

### 1. Install uv

```bash
# macOS
brew install uv

# Or using pip
pip install uv
```

### 2. Install Dependencies

```bash
cd backend-python
uv sync
```

### 3. Run the Server

```bash
uv run uvicorn app.main:app --reload --port 8000
```

## Migration from Laravel Backend

### Data Compatibility

The Python backend uses the **exact same data structure** as the Laravel backend:

```
/data/
  /songs/
    /{song-uuid}/
      - config.json
      - song.mid
      - score.xml
  /index.json
```

**No data migration needed!** Your existing songs will work immediately.

### API Compatibility

All endpoints are **100% compatible** with the Laravel implementation:

- `GET /api/health`
- `GET /api/songs`
- `POST /api/songs`
- `GET /api/songs/{id}`
- `PUT /api/songs/{id}`
- `DELETE /api/songs/{id}`
- `POST /api/songs/{id}/upload/midi`
- `POST /api/songs/{id}/upload/score`
- `GET /api/songs/{id}/midi`
- `GET /api/songs/{id}/score`
- `GET /api/songs/{id}/sections`
- `POST /api/songs/{id}/sections`
- `PUT /api/songs/{id}/sections/{sectionId}`
- `DELETE /api/songs/{id}/sections/{sectionId}`

### Switching from Laravel to Python

**Option 1: Development (Local)**

1. Stop the Laravel backend:
   ```bash
   docker compose down
   ```

2. Start the Python backend:
   ```bash
   cd backend-python
   docker compose -f docker-compose.python.yml up -d
   ```

3. Update frontend API URL (if different port):
   - Laravel uses: `http://localhost:8080/api`
   - Python uses: `http://localhost:8000/api`
   
   See "Frontend API URL Changes" section below.

**Option 2: Production**

Replace the Laravel deployment with Python backend Docker container.

## Frontend API URL Changes

When switching from Laravel (port 8080) to Python (port 8000):

### For Local Development:

Edit these files to change `8080` to `8000`:

1. **`frontend/src/config.js`**
   ```javascript
   const config = {
     apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
     // Changed from 8080 to 8000
   ```

2. **`frontend/src/api/client.js`** (if not using config.js)
   ```javascript
   const apiClient = axios.create({
     baseURL: 'http://localhost:8000/api',  // Change port
   ```

### For Production:

The URL stays the same - it's based on your domain, not the port:
- `https://choirloop.rosakehlchen.de/api`

No changes needed for production deployments!

## Project Structure

```
backend-python/
├── Dockerfile                      # Docker image definition
├── docker-compose.python.yml       # Docker Compose configuration
├── pyproject.toml                  # Python dependencies (uv)
├── README.md                       # This file
└── app/
    ├── __init__.py
    ├── main.py                     # FastAPI app entry point
    ├── models.py                   # Pydantic models
    ├── storage.py                  # File-based storage service
    └── routes/
        ├── __init__.py
        ├── health.py               # Health check endpoint
        ├── songs.py                # Song CRUD endpoints
        ├── files.py                # File upload/download
        └── sections.py             # Practice sections
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## Development

### Adding New Endpoints

1. Create/edit route file in `app/routes/`
2. Add router to `app/main.py`
3. The server auto-reloads on code changes

### Running Tests

```bash
uv run pytest
```

## Deployment

### Docker Deployment

```bash
# Build
docker build -t choirloop-python-api .

# Run
docker run -d \
  -p 8000:8000 \
  -v /path/to/data:/app/data \
  choirloop-python-api
```

### Production Environment Variables

Create a `.env` file in `backend-python/`:

```env
CORS_ORIGINS=https://choirloop.rosakehlchen.de
DATA_DIR=/app/data
```

## Performance Notes

- **FastAPI** is significantly faster than Laravel for API responses
- **uv** provides faster dependency installation than pip
- **Async file operations** with aiofiles for better concurrency
- **Automatic API documentation** with OpenAPI/Swagger

## Migration Benefits

1. ✅ **Simpler deployment** - Single Docker container, no PHP/Apache/Composer complexity
2. ✅ **Better performance** - FastAPI is async and highly optimized
3. ✅ **Modern Python** - Type hints, async/await, better tooling
4. ✅ **Auto documentation** - Built-in Swagger UI
5. ✅ **Easier to maintain** - Less boilerplate than Laravel
6. ✅ **Same data format** - No migration needed!

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, edit `docker-compose.python.yml`:
```yaml
ports:
  - "8001:8000"  # Use different external port
```

### Data Directory Issues

Ensure the data directory exists and has proper permissions:
```bash
mkdir -p ../data/songs
chmod 777 ../data
```

### CORS Issues

Update `app/main.py` to add your frontend URL to `allow_origins`.

## Support

For issues or questions, refer to:
- FastAPI docs: https://fastapi.tiangolo.com/
- uv docs: https://docs.astral.sh/uv/
- OpenAPI spec: `../openapi.yaml`
