#!/bin/bash

# ChoirLoop Frontend Deployment Script
# This script builds and deploys only the frontend to the web server

set -e  # Exit on error

echo "================================================"
echo "   ChoirLoop Frontend Deployment"
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

# Load FTP credentials from .env.deploy
if [ -f ".env.deploy" ]; then
    print_success "Loading credentials from .env.deploy"
    source .env.deploy
    
    # Validate required variables
    if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ] || [ -z "$FTP_REMOTE_DIR" ]; then
        print_error "Missing required variables in .env.deploy"
        print_info "Please ensure FTP_HOST, FTP_USER, FTP_PASS, and FTP_REMOTE_DIR are set"
        exit 1
    fi
    
    REMOTE_DIR="$FTP_REMOTE_DIR"
    PROD_URL="${PROD_URL:-https://choirloop.rosakehlchen.de}"
    
    print_success "Credentials loaded successfully"
else
    print_error ".env.deploy not found"
    print_info "Please copy .env.deploy.example to .env.deploy and fill in your credentials"
    exit 1
fi

echo ""
print_info "Using FTP host: $FTP_HOST"
print_info "Remote directory: $REMOTE_DIR"
print_info "Production URL: $PROD_URL"
echo ""

# Confirm before proceeding
read -p "Continue with frontend deployment? (y/n): " CONFIRM
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
echo "Step 2: Uploading Frontend via FTP"
echo "================================================"

print_info "Uploading frontend files via FTP..."
print_info "Target: $REMOTE_DIR"

# Create lftp script for frontend upload
cat > /tmp/lftp_deploy_frontend.txt << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
lcd frontend/dist
cd $REMOTE_DIR

# Upload all files from dist
mirror -R --delete --verbose ./ ./

bye
EOF

# Execute lftp
lftp -f /tmp/lftp_deploy_frontend.txt

if [ $? -eq 0 ]; then
    print_success "Frontend files uploaded successfully!"
else
    print_error "FTP upload failed"
    rm /tmp/lftp_deploy_frontend.txt
    exit 1
fi

# Clean up
rm /tmp/lftp_deploy_frontend.txt

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
print_success "Frontend deployed to: $REMOTE_DIR"
print_info "Your application should be accessible at: $PROD_URL"
echo ""
print_info "The frontend is now using the API at: https://choirloop-api.rosakehlchen.de/api"
echo ""
