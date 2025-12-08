# Docker Setup for Jarvis Server

This document explains how to run the Jarvis Server using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 1.29+ installed

## Quick Start

1. **Build and start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:8080`

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the services:**
   ```bash
   docker-compose down
   ```

## Configuration

### Environment Variables

The application can be configured using environment variables in the `docker-compose.yml` file:

- `PORT`: The port the application listens on (default: 8080)
- `HOST`: The host the application binds to (default: 0.0.0.0)
- `DATABASE_URL`: Database connection string (default: SQLite)
- `REDIS_URL`: Redis connection string (default: redis://redis:6379)
- `WEBUI_SECRET_KEY`: Secret key for encryption (change this in production!)

### Volumes

- `./data`: Persistent data storage for the application database and uploaded files

## Development Mode

For development, use the development docker-compose file:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This setup mounts the local source code directories into the container, allowing for live code changes.

## Building the Image Manually

To build the Docker image manually:

```bash
docker build -t jarvis-server .
```

Then run it:

```bash
docker run -p 8080:8080 jarvis-server
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   Change the port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "8081:8080"  # Map host port 8081 to container port 8080
   ```

2. **Permission denied errors:**
   Ensure the `data` directory has proper permissions:
   ```bash
   mkdir -p data
   chmod 777 data
   ```

3. **Database migration issues:**
   The application automatically runs migrations on startup. Check logs for any errors.

### Viewing Logs

```bash
# View all logs
docker-compose logs

# View and follow logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs jarvis
```

## Architecture

The Docker setup consists of:

1. **Main Application Service (`jarvis`)**: Runs the Python FastAPI backend and serves the Next.js frontend
2. **Redis Service (`redis`)**: Provides caching and session storage

Both services are connected on the same Docker network and can communicate with each other.

## Security Notes

- Change the `WEBUI_SECRET_KEY` environment variable in production
- The application runs as a non-root user inside the container
- Redis is not exposed to external networks