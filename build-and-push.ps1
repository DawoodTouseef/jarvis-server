# Build and Push Script for Jarvis Server Docker Image
# This script builds the Docker image and pushes it to Docker Hub

# Configuration
$IMAGE_NAME = "jarvis-server"
$DOCKERHUB_REPO = ""  # Enter your Docker Hub username here
$TAG = "latest"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Building and Pushing $IMAGE_NAME Docker Image" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if we're logged into Docker Hub
$dockerInfo = docker info 2>$null
if ($dockerInfo -notmatch "Username") {
    Write-Host "Warning: Not logged into Docker Hub. Please run 'docker login' first" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
}

# Get the directory of this script
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t "$IMAGE_NAME`:$TAG" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building Docker image" -ForegroundColor Red
    exit 1
}

# Tag for Docker Hub if repository is specified
if ($DOCKERHUB_REPO -and $DOCKERHUB_REPO -ne "your-dockerhub-username") {
    Write-Host "Tagging image for Docker Hub..." -ForegroundColor Yellow
    docker tag "$IMAGE_NAME`:$TAG" "$DOCKERHUB_REPO`/$IMAGE_NAME`:$TAG"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error tagging Docker image" -ForegroundColor Red
        exit 1
    }
}

# Push to Docker Hub if repository is specified
if ($DOCKERHUB_REPO -and $DOCKERHUB_REPO -ne "your-dockerhub-username") {
    Write-Host "Pushing image to Docker Hub..." -ForegroundColor Yellow
    docker push "$DOCKERHUB_REPO`/$IMAGE_NAME`:$TAG"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error pushing Docker image" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Image pushed to $DOCKERHUB_REPO`/$IMAGE_NAME`:$TAG" -ForegroundColor Green
} else {
    Write-Host "Docker Hub repository not set. Skipping push." -ForegroundColor Yellow
    Write-Host "To push manually, run:" -ForegroundColor Yellow
    Write-Host "docker tag $IMAGE_NAME`:$TAG `<your-repo`>`/$IMAGE_NAME`:$TAG" -ForegroundColor Yellow
    Write-Host "docker push `<your-repo`>`/$IMAGE_NAME`:$TAG" -ForegroundColor Yellow
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Build and push completed successfully!" -ForegroundColor Green
Write-Host "Image: $IMAGE_NAME`:$TAG" -ForegroundColor Green
if ($DOCKERHUB_REPO -and $DOCKERHUB_REPO -ne "your-dockerhub-username") {
    Write-Host "Docker Hub: $DOCKERHUB_REPO`/$IMAGE_NAME`:$TAG" -ForegroundColor Green
}
Write-Host "=========================================" -ForegroundColor Green