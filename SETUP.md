# ChoirLoop Setup Guide

This guide walks you through setting up the ChoirLoop development environment with Laravel and React.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- Git

## Initial Setup

### 1. Start Docker Container

```bash
# Start the PHP/Apache container
docker-compose up -d

# Verify it's running
docker-compose ps
```

### 2. Install Laravel Backend

```bash
# Enter the Docker container
docker-compose exec php-app bash

# Inside the container, create Laravel project
composer create-project laravel/laravel backend

# Exit container
exit
```

### 3. Configure Laravel

After Laravel installation, configure it for the project:

```bash
# Enter container again
docker-compose exec php-app bash

# Navigate to Laravel directory
cd backend

# Install Laravel Sanctum for API authentication (optional for later)
composer require laravel/sanctum

# Install MIDI parsing library (check availability)
# composer require <midi-parser-package>

# Generate application key (if not already done)
php artisan key:generate

# Exit container
exit
```

### 4. Set Up Laravel API Routes

Edit `backend/routes/api.php` to add your API endpoints:

```php
use Illuminate\Support\Facades\Route;

Route::prefix('songs')->group(function () {
    Route::get('/', 'SongController@index');
    Route::post('/', 'SongController@store');
    Route::get('/{id}', 'SongController@show');
    Route::put('/{id}', 'SongController@update');
    Route::delete('/{id}', 'SongController@destroy');
    
    Route::post('/{id}/upload/midi', 'SongController@uploadMidi');
    Route::post('/{id}/upload/score', 'SongController@uploadScore');
    
    Route::get('/{id}/sections', 'PracticeSectionController@index');
    Route::post('/{id}/sections', 'PracticeSectionController@store');
});
```

### 5. Configure CORS

Edit `config/cors.php` in Laravel to allow requests from React frontend:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173'], // Vite default port
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### 6. Set Up React Frontend

**Important:** The React frontend is set up on your **host machine** (outside the Docker container), not inside the container.

```bash
# From project root (on your host machine - NOT in the Docker container)
npm create vite@latest frontend -- --template react

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom axios tone @react-pdf/renderer

# For state management (choose one)
npm install zustand
# OR
npm install @tanstack/react-query
```

### 7. Configure React to Connect to Laravel API

Create `frontend/src/api/client.js`:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default apiClient;
```

### 8. Create Data Storage Directory

```bash
# From project root
mkdir -p data/songs
echo '[]' > data/index.json

# Set permissions (if needed)
chmod -R 777 data
```

## Running the Application

### Backend (Laravel)

```bash
# Start Docker container (if not already running)
docker-compose up -d

# Laravel API will be available at: http://localhost:8080/api
```

### Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Start Vite dev server
npm run dev

# Frontend will be available at: http://localhost:5173
```

## Development Workflow

### Backend Development

1. Make changes to Laravel code in `backend/`
2. Changes are automatically reflected (volume mounted)
3. Check logs: `docker-compose logs -f php-app`

### Frontend Development

1. Make changes to React code in `frontend/src/`
2. Vite hot-reloads automatically
3. Check browser console for errors

### Installing New PHP Dependencies

```bash
docker-compose exec php-app bash
cd backend
composer require package-name
exit
```

### Installing New Node Dependencies

```bash
cd frontend
npm install package-name
```

## Testing the Setup

### Test Laravel API

```bash
# Test basic endpoint
curl http://localhost:8080/api/songs
```

### Test React Frontend

1. Open browser to http://localhost:5173
2. Check browser console for any errors
3. Verify API calls are working

## Common Issues

### Port Already in Use

If port 8080 or 5173 is already in use:

**For Backend:**
- Edit `docker-compose.yml` and change `"8080:80"` to `"<new-port>:80"`
- Update React API client to use new port

**For Frontend:**
- Edit `frontend/vite.config.js` and add:
  ```javascript
  export default {
    server: {
      port: 3000 // or any other port
    }
  }
  ```

### CORS Issues

If you see CORS errors in the browser:
1. Verify `config/cors.php` in Laravel
2. Make sure the frontend URL is in `allowed_origins`
3. Clear Laravel config cache: `php artisan config:clear`

### File Upload Issues

If file uploads fail:
1. Check directory permissions in `data/` folder
2. Verify `upload_max_filesize` and `post_max_size` in PHP config
3. Check Laravel storage configuration

## Next Steps

After completing this setup:

1. Create Laravel controllers and models for songs
2. Implement file upload handling
3. Add MIDI parsing functionality
4. Build React components for UI
5. Integrate Tone.js for audio playback
6. Test the complete workflow

See `architecture_docs/currentTask.md` for detailed next steps.
