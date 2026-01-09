#!/bin/bash

# Build and Push Script for Jarvis Server Docker Image
# This script builds the Docker image and pushes it to Docker Hub

# Exit on any error
set -e

# Configuration
IMAGE_NAME="jarvis-server"
DOCKERHUB_REPO="your-dockerhub-username"  # Change this to your Docker Hub username
TAG="latest"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check if we're logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo "Warning: Not logged into Docker Hub. Please run 'docker login' first"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "========================================="
echo "Building and Pushing $IMAGE_NAME Docker Image"
echo "========================================="

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Build the Docker image
echo "Building Docker image..."
docker build -t "$IMAGE_NAME:$TAG" .

# Tag for Docker Hub
if [ -n "$DOCKERHUB_REPO" ]; then
    echo "Tagging image for Docker Hub..."
    docker tag "$IMAGE_NAME:$TAG" "$DOCKERHUB_REPO/$IMAGE_NAME:$TAG"
fi

# Push to Docker Hub
if [ -n "$DOCKERHUB_REPO" ]; then
    echo "Pushing image to Docker Hub..."
    docker push "$DOCKERHUB_REPO/$IMAGE_NAME:$TAG"
    echo "Image pushed to $DOCKERHUB_REPO/$IMAGE_NAME:$TAG"
else
    echo "Docker Hub repository not set. Skipping push."
    echo "To push manually, run:"
    echo "docker tag $IMAGE_NAME:$TAG <your-repo>/$IMAGE_NAME:$TAG"
    echo "docker push <your-repo>/$IMAGE_NAME:$TAG"
fi

echo "========================================="
echo "Build and push completed successfully!"
echo "Image: $IMAGE_NAME:$TAG"
if [ -n "$DOCKERHUB_REPO" ]; then
    echo "Docker Hub: $DOCKERHUB_REPO/$IMAGE_NAME:$TAG"
fi
echo "========================================="