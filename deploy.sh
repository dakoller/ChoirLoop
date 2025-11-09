#!/bin/bash

# ChoirLoop Deployment Script for macOS
# This script builds the application locally and deploys via FTP

set -e  # Exit on error

echo "================================================"
echo "   ChoirLoop Deployment Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if lftp is installed (required for FTP uploads)
if ! command -v lftp &> /dev/null; then
    print_error "lftp is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install lftp
        print_success "lftp installed"
    else
        print_error "Homebrew not found. Please install lftp manually: brew install lftp"
        exit 1
    fi
fi

# Load FTP credentials from .env.deploy or prompt for them
if [ -f ".env.deploy" ]; then
    print_success "Loading credentials from .env.deploy"
    source .env.deploy
    
    # Validate required variables
    if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ] || [ -z "$FTP_REMOTE_DIR" ]; then
        print_error "Missing required variables in .env.deploy"
        print_info "Please ensure FTP_HOST, FTP_USER, FTP_PASS, and FTP_REMOTE_DIR are set"
        exit 1
    fi
    
    # Use variables from .env.deploy
    REMOTE_DIR="$FTP_REMOTE_DIR"
    PROD_URL="${PROD_URL:-https://choirloop.rosakehlchen.de}"
    
    print_success "Credentials loaded successfully"
else
    print_info ".env.deploy not found. Please enter credentials manually:"
    print_info "(To avoid entering credentials each time, copy .env.deploy.example to .env.deploy and fill it in)"
    echo ""
    
    # Get FTP credentials interactively
    read -p "FTP Host (e.g., ftp.yourserver.com): " FTP_HOST
    read -p "FTP Username: " FTP_USER
    read -sp "FTP Password: " FTP_PASS
    echo ""
    read -p "Remote directory path (e.g., /httpdocs): " REMOTE_DIR
    PROD_URL="https://choirloop.rosakehlchen.de"
fi

echo ""
print_info "Using FTP host: $FTP_HOST"
print_info "Remote directory: $REMOTE_DIR"
echo ""

# Confirm before proceeding
read -p "Continue with deployment? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    print_error "Deployment cancelled"
    exit 0
fi

echo ""
echo "================================================"
echo "Step 1: Building Frontend"
echo "================================================"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
fi

print_info "Building React frontend for production..."
npm run build

if [ -d "dist" ]; then
    print_success "Frontend built successfully in frontend/dist/"
else
    print_error "Frontend build failed - dist folder not created"
    exit 1
fi

cd ..

echo ""
echo "================================================"
echo "Step 2: Preparing Backend"
echo "================================================"

# Enter Docker container to build backend
print_info "Installing backend dependencies via Docker..."
docker compose exec -T php-app bash -c "cd /var/www/html/backend && composer install --no-dev --optimize-autoloader --no-interaction"

if [ -d "backend/vendor" ]; then
    print_success "Backend dependencies installed in backend/vendor/"
else
    print_error "Backend vendor folder not created"
    exit 1
fi

echo ""
echo "================================================"
echo "Step 3: Creating Deployment Package"
echo "================================================"

# Create a temporary deployment directory
DEPLOY_DIR="deploy_temp_$(date +%s)"
mkdir -p "$DEPLOY_DIR"

print_info "Creating deployment structure in $DEPLOY_DIR..."

# Copy backend files
mkdir -p "$DEPLOY_DIR/backend"
cp -R backend/app "$DEPLOY_DIR/backend/"
cp -R backend/bootstrap "$DEPLOY_DIR/backend/"
cp -R backend/config "$DEPLOY_DIR/backend/"
cp -R backend/public "$DEPLOY_DIR/backend/"
cp -R backend/resources "$DEPLOY_DIR/backend/"
cp -R backend/routes "$DEPLOY_DIR/backend/"
cp -R backend/storage "$DEPLOY_DIR/backend/"
cp -R backend/database "$DEPLOY_DIR/backend/"
cp -R backend/vendor "$DEPLOY_DIR/backend/"
cp backend/artisan "$DEPLOY_DIR/backend/"
cp backend/composer.json "$DEPLOY_DIR/backend/"
cp backend/composer.lock "$DEPLOY_DIR/backend/"

# Copy .env.example as .env
cp backend/.env.example "$DEPLOY_DIR/backend/.env"

# Copy frontend dist to backend/public (to serve from same domain)
print_info "Copying frontend build to backend/public..."
cp -R frontend/dist/* "$DEPLOY_DIR/backend/public/"

# Create data directory structure
mkdir -p "$DEPLOY_DIR/data/songs"
echo "[]" > "$DEPLOY_DIR/data/index.json"

print_success "Deployment package created in $DEPLOY_DIR/"

echo ""
echo "================================================"
echo "Step 4: Uploading to Web Hoster via FTP"
echo "================================================"

print_info "Uploading files via FTP..."
print_info "This may take several minutes for the vendor folder..."

# Create lftp script
cat > /tmp/lftp_deploy.txt << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
lcd $DEPLOY_DIR
cd $REMOTE_DIR

# Create directories
mkdir -p backend/app
mkdir -p backend/bootstrap
mkdir -p backend/config
mkdir -p backend/public
mkdir -p backend/resources
mkdir -p backend/routes
mkdir -p backend/storage
mkdir -p backend/database
mkdir -p backend/vendor
mkdir -p data/songs

# Upload backend files
mirror -R backend/app backend/app
mirror -R backend/bootstrap backend/bootstrap
mirror -R backend/config backend/config
mirror -R backend/public backend/public
mirror -R backend/resources backend/resources
mirror -R backend/routes backend/routes
mirror -R backend/storage backend/storage
mirror -R backend/database backend/database
mirror -R backend/vendor backend/vendor

# Upload individual files
put backend/artisan -o backend/artisan
put backend/composer.json -o backend/composer.json
put backend/composer.lock -o backend/composer.lock
put backend/.env -o backend/.env

# Upload data structure
put data/index.json -o data/index.json

bye
EOF

# Execute lftp
lftp -f /tmp/lftp_deploy.txt

if [ $? -eq 0 ]; then
    print_success "Files uploaded successfully!"
else
    print_error "FTP upload failed"
    rm -rf "$DEPLOY_DIR"
    rm /tmp/lftp_deploy.txt
    exit 1
fi

# Clean up
rm /tmp/lftp_deploy.txt

echo ""
echo "================================================"
echo "Step 5: Post-Deployment Instructions"
echo "================================================"

print_info "Manual steps you need to complete on your web hoster:"
echo ""
echo "1. Edit backend/.env file:"
echo "   - Set APP_KEY (generate one at: https://generate-random.org/laravel-key-generator)"
echo "   - Set APP_ENV=production"
echo "   - Set APP_DEBUG=false"
echo "   - Set APP_URL=$PROD_URL"
echo ""
echo "2. Set directory permissions (via FTP or web hoster panel):"
echo "   - backend/storage/ → 775 or 777"
echo "   - backend/bootstrap/cache/ → 775 or 777"
echo "   - data/ → 775 or 777"
echo ""
echo "3. Ensure document root points to: $REMOTE_DIR/backend/public"
echo ""
echo "4. Test the deployment:"
echo "   curl $PROD_URL/api/health"
echo ""

# Clean up temporary deployment directory
print_info "Cleaning up temporary files..."
rm -rf "$DEPLOY_DIR"
print_success "Temporary deployment directory removed"

echo ""
print_success "Deployment complete!"
echo ""
print_info "Frontend deployed to: $REMOTE_DIR/backend/public/"
print_info "Backend deployed to: $REMOTE_DIR/backend/"
print_info "Data directory: $REMOTE_DIR/data/"
echo ""
print_info "Your application should be accessible at: $PROD_URL"
echo ""
