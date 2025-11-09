# ChoirLoop Deployment Guide

This guide explains how to deploy ChoirLoop from your local Docker development environment to your web hoster.

## Prerequisites

- Access to your web hoster (FTP/SFTP or file manager)
- PHP 8.0+ available on your web hoster
- Your web hoster domain (e.g., `https://choirloop.yoursite.com`)

## Overview

The deployment process involves:
1. Building the React frontend for production
2. Preparing the Laravel backend
3. Configuring base URLs
4. Uploading files to your web hoster
5. Setting up the data directory

---

## Step 1: Configure Base URL

### For API Communication

Before building, you need to configure the base URL so your frontend knows where to find your backend API.

**Location: `frontend/src/api/client.js`**

Update the `baseURL` to point to your production server:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  // CHANGE THIS to your production URL:
  baseURL: 'https://choirloop.yoursite.com/api',
  // For local development, use: 'http://localhost:8080/api'
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Rest of the file...
export default apiClient;
```

### For MusicXML and MIDI File Loading

**Important:** There are hardcoded URLs in two components that need to be updated:

**1. `frontend/src/components/VoiceConfiguration.jsx`**

Find and update line ~91:
```javascript
// BEFORE:
const response = await fetch(`http://localhost:8080/api/songs/${songId}/midi`);

// AFTER (use your production URL):
const response = await fetch(`https://choirloop.yoursite.com/api/songs/${songId}/midi`);
```

**2. `frontend/src/components/AudioPlayer.jsx`**

Find and update line ~52:
```javascript
// BEFORE:
const response = await fetch(`http://localhost:8080/api/songs/${songId}/midi`);

// AFTER (use your production URL):
const response = await fetch(`https://choirloop.yoursite.com/api/songs/${songId}/midi`);
```

**3. `frontend/src/components/ScoreViewer.jsx`**

Find and update line ~44:
```javascript
// BEFORE:
const scoreUrl = `http://localhost:8080/api/songs/${songId}/score`;

// AFTER (use your production URL):
const scoreUrl = `https://choirloop.yoursite.com/api/songs/${songId}/score`;
```

### Recommended: Use Environment Variables

For better management (especially for deeplinks), create an environment-based configuration:

**Create `frontend/src/config.js`:**
```javascript
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173',
};

export default config;
```

**Then update your components to use:**
```javascript
import config from '../config';

// In apiClient.js:
baseURL: config.apiBaseUrl

// In components:
const response = await fetch(`${config.apiBaseUrl.replace('/api', '')}/api/songs/${songId}/midi`);
```

**Create `frontend/.env.production`:**
```
VITE_API_BASE_URL=https://choirloop.yoursite.com/api
VITE_APP_BASE_URL=https://choirloop.yoursite.com
```

---

## Step 2: Build Frontend for Production

```bash
cd frontend

# Install dependencies if not already done
npm install

# Build for production (uses .env.production if you created it)
npm run build

# This creates a 'dist' folder with optimized files
```

The `dist` folder will contain:
- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, and other assets
- All optimized for production

---

## Step 3: Prepare Backend Files

**Without SSH Access (FTP/File Manager Only):**

Since you don't have SSH access to your web hoster, you need to prepare the `vendor/` folder locally and upload it:

```bash
# Enter the Docker container
docker-compose exec php-app bash

# Inside container:
cd backend

# Install production dependencies only (no dev dependencies)
composer install --no-dev --optimize-autoloader

# Exit container
exit
```

This creates the `vendor/` folder in your local `backend/` directory, which you'll upload via FTP in Step 4.

**Note:** The `vendor/` folder can be large (50-100MB+). Make sure your FTP client can handle large transfers, and consider using an FTP client that supports resuming interrupted transfers (like FileZilla).

---

## Step 4: Upload to Web Hoster

### Backend Upload

**Copy these files/folders from `backend/` to your web hoster:**

```
backend/
├── app/              ← Upload entire folder
├── bootstrap/        ← Upload entire folder
├── config/           ← Upload entire folder
├── public/           ← Upload entire folder (this is your document root!)
├── resources/        ← Upload entire folder
├── routes/           ← Upload entire folder
├── storage/          ← Upload entire folder
├── vendor/           ← Upload entire folder (after running composer install)
├── artisan           ← Upload file
├── composer.json     ← Upload file
├── composer.lock     ← Upload file
└── .env.example      ← Upload and rename to .env
```

**Important:** Your web hoster's **document root** must point to `backend/public/`

### Frontend Upload

**Copy the contents of `frontend/dist/` to your web hoster:**

Option A: Serve frontend from same domain (recommended):
```
public/
├── index.html      ← From dist/
├── assets/         ← From dist/assets/
└── (other files)   ← From dist/
```

Option B: Serve from subdomain or separate directory:
- Upload `dist/` contents to your frontend hosting location
- Update CORS settings in Laravel

### Data Directory

**Create and upload the data structure:**

```
data/
├── songs/          ← Create empty folder
└── index.json      ← Upload with content: []
```

**Important:** Make sure the `data/` folder is **outside** the `public/` directory for security, or ensure proper .htaccess rules to prevent direct access.

Recommended location: Same level as `backend/`

```
your-server/httpdocs/  (your public folder)
├── backend/
│   └── public/   ← Document root points here: httpdocs/backend/public/
├── data/         ← Song storage (outside httpdocs for security)
```

**Important:** Your web hoster's document root should be: `httpdocs/backend/public/`

---

## Step 5: Configure Laravel Environment

**Edit `backend/.env` on your web hoster:**

```env
APP_NAME=ChoirLoop
APP_ENV=production
APP_KEY=  # Generate with: php artisan key:generate
APP_DEBUG=false  # IMPORTANT: Set to false for production
APP_URL=https://choirloop.yoursite.com

# Database (not used, but required by Laravel)
DB_CONNECTION=sqlite

# Session & Cache
SESSION_DRIVER=file
CACHE_DRIVER=file

# CORS - Update to your frontend URL
CORS_ALLOWED_ORIGINS=https://choirloop.yoursite.com
```

---

## Step 6: Set Directory Permissions

On your web hoster, set the following permissions:

```bash
# Storage folders need to be writable
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache

# Data folder needs to be writable
chmod -R 775 data

# If your web server user is different, you may need:
chown -R www-data:www-data backend/storage
chown -R www-data:www-data data
```

---

## Step 7: Configure CORS for Production

**Edit `backend/config/cors.php`:**

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://choirloop.yoursite.com',  // Your production URL
        // Add any additional domains if needed
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

---

## Step 8: Web Server Configuration

### Apache (.htaccess)

Your web hoster likely uses Apache. Ensure `backend/public/.htaccess` exists with:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

### Nginx (if applicable)

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location /api {
    try_files $uri $uri/ /index.php?$query_string;
}
```

---

## Step 9: Post-Deployment Steps

Once files are uploaded:

1. **Generate Application Key** (if not done):
   ```bash
   php artisan key:generate
   ```

2. **Clear Caches**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   ```

3. **Test the API**:
   ```bash
   curl https://choirloop.yoursite.com/api/health
   # Should return: {"status":"ok","message":"ChoirLoop API is running"}
   ```

4. **Test the Frontend**:
   - Visit `https://choirloop.yoursite.com`
   - Should see ChoirLoop interface
   - Check browser console for any errors

---

## Troubleshooting

### Issue: "404 Not Found" for API endpoints

**Solution:** Ensure your web hoster's document root points to `backend/public/`, not just `backend/`

### Issue: "CORS errors"

**Solution:** 
1. Check `backend/config/cors.php` has your production URL
2. Clear config cache: `php artisan config:clear`

### Issue: "File upload fails"

**Solution:**
1. Check `data/` folder permissions (775 or 777)
2. Check PHP upload limits in `php.ini`:
   ```ini
   upload_max_filesize = 100M
   post_max_size = 100M
   ```

### Issue: Frontend can't connect to API

**Solution:** Verify all base URLs are updated:
- `frontend/src/api/client.js`
- `frontend/src/components/VoiceConfiguration.jsx`
- `frontend/src/components/AudioPlayer.jsx`
- `frontend/src/components/ScoreViewer.jsx`

---

## Directory Structure on Web Hoster

Recommended final structure:

```
/home/youruser/  (or your user directory)
├── httpdocs/  (your public web folder)
│   └── backend/
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── public/       ← DOCUMENT ROOT: httpdocs/backend/public/
│       ├── routes/
│       ├── storage/
│       ├── vendor/
│       └── .env
└── data/  (outside httpdocs for security!)
    ├── songs/
    └── index.json
```

**Key Point:** The `data/` folder should be **outside** `httpdocs/` to prevent direct web access to uploaded files.

---

## For Future: Deeplink Support

To prepare for deeplinks, you should use environment variables for all URLs:

**Create `frontend/src/config.js`:**
```javascript
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173',
  
  // Helper for deeplinks
  createDeeplink: (songId, sectionId = null) => {
    const base = config.appBaseUrl;
    if (sectionId) {
      return `${base}/song/${songId}/section/${sectionId}`;
    }
    return `${base}/song/${songId}`;
  }
};

export default config;
```

Then use React Router to handle deeplink routes like:
- `/song/:songId` - Opens specific song
- `/song/:songId/section/:sectionId` - Opens song with section selected

---

## Maintenance

### Updating the Application

1. Make changes locally in Docker
2. Test thoroughly
3. Build frontend: `npm run build`
4. Upload only changed files to web hoster
5. Clear Laravel caches

### Backup

Regularly backup:
- `data/` folder (all song files)
- `backend/.env` file (configuration)

---

## Security Notes

1. **Never commit `.env` files** to git
2. **Set `APP_DEBUG=false`** in production
3. **Keep `data/` outside public web root**
4. **Regularly update Composer dependencies**
5. **Use HTTPS** for your production site

---

## Quick Deployment Checklist

- [ ] Update all base URLs in frontend code
- [ ] Build frontend: `npm run build`
- [ ] Run `composer install --no-dev --optimize-autoloader` in backend
- [ ] Upload `backend/` folder (except `vendor/` initially)
- [ ] Upload `data/` folder
- [ ] Upload `frontend/dist/` contents to public folder
- [ ] Create `.env` file from `.env.example`
- [ ] Generate APP_KEY: `php artisan key:generate`
- [ ] Set correct document root to `backend/public/`
- [ ] Set directory permissions (775 for storage and data)
- [ ] Upload `vendor/` folder or run `composer install` on server
- [ ] Update CORS configuration with production URL
- [ ] Test API endpoint
- [ ] Test frontend application

---

## Support

If you encounter issues:
1. Check Laravel logs: `backend/storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify all URLs are updated for production
4. Ensure file permissions are correct

---

## Example Production URLs

If your domain is `choirloop.yoursite.com`:

**API Base URL:** `https://choirloop.yoursite.com/api`
**App Base URL:** `https://choirloop.yoursite.com`
**MIDI File:** `https://choirloop.yoursite.com/api/songs/{id}/midi`
**MusicXML:** `https://choirloop.yoursite.com/api/songs/{id}/score`

Update all occurrences of `http://localhost:8080` and `http://localhost:5173` with these URLs.
