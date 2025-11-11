# Python Backend for ChoirLoop using uv
FROM python:3.12-slim

# Install system dependencies for MIDI to MP3 conversion
# RUN apt-get update && apt-get install -y \
#     fluidsynth \
#     timgm6mb-soundfont \
#     ffmpeg \
#     && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files first (for better caching)
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
