# Multi-stage Dockerfile for Jarvis Server

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files for frontend
COPY package*.json ./

# Install frontend dependencies
RUN npm install  --force

# Copy frontend source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Build the backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python dependencies from backend builder stage
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy built frontend from frontend builder stage
COPY --from=frontend-builder /app/.next /app/.next
COPY --from=frontend-builder /app/public /app/public
COPY --from=frontend-builder /app/package.json /app/package.json
COPY --chown=appuser:appuser lib/  /app/lib
COPY --chown=appuser:appuser components/  ./components/
COPY --chown=appuser:appuser internal/  ./internal/
COPY --chown=appuser:appuser hooks/  ./hooks/
COPY --chown=appuser:appuser styles/  ./styles/
COPY --chown=appuser:appuser app/  ./app
COPY --chown=appuser:appuser ./  ./


# Copy backend source code
COPY --chown=appuser:appuser backend/ ./backend/
COPY --chown=appuser:appuser start.py ./

# Copy alembic.ini from backend directory
COPY --chown=appuser:appuser backend/alembic.ini ./backend/

# Copy other necessary files
COPY --chown=appuser:appuser components.json ./
COPY --chown=appuser:appuser next.config.mjs ./
COPY --chown=appuser:appuser postcss.config.mjs ./
COPY --chown=appuser:appuser tsconfig.json ./

# Create data directory
RUN mkdir -p /app/backend/data

# Change ownership of all files to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command
CMD ["python", "start.py"]