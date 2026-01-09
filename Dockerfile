# Multi-stage Dockerfile for Jarvis Server

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Install with dev dependencies for build, then remove them later if needed
# ENV NODE_ENV=production

# Copy package files for frontend
COPY package*.json ./

# Install frontend dependencies (including dev deps required for build)
RUN npm install --force

# Copy frontend source code
COPY components ./components
COPY app ./app
COPY lib ./lib
COPY styles ./styles
COPY hooks ./hooks
COPY public ./public
COPY next.config.mjs ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./

# Build the frontend
RUN npm run build

# Ensure node_modules are present for runtime (copied into final image)
# (node_modules will be copied in the final stage to run `next start`)

# Stage 2: Build the backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    avahi-daemon \
    libnss-mdns \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements-docker.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and Node.js runtime so we can run `next start`
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    avahi-daemon \
    libnss-mdns \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python dependencies from backend builder stage
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy built frontend (including node_modules) from frontend builder stage
COPY --from=frontend-builder /app/.next /app/.next
COPY --from=frontend-builder /app/public /app/public
COPY --from=frontend-builder /app/package.json /app/package.json
COPY --from=frontend-builder /app/node_modules /app/node_modules

# Copy app code and frontend components
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

# Copy mDNS service configuration
COPY --chown=root:root jarvis.service /etc/avahi/services/

# Create data directory
RUN mkdir -p /app/backend/data

# Create directories for mDNS configuration
RUN mkdir -p /etc/avahi/services

# Create a small start script that launches both Next (frontend) and Python (backend)
RUN printf '#!/bin/sh\n# Start avahi daemon\n/usr/sbin/avahi-daemon --daemonize --no-chroot 2>/dev/null || true\ncd /app\nNODE_ENV=production npm run start &\nexec python start.py\n' > /usr/local/bin/start.sh \
    && chmod +x /usr/local/bin/start.sh



# Change ownership of all files to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose backend, frontend, and mDNS ports
EXPOSE 8080 3000 5353

# Health check for backend
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command: run avahi, start Next (foreground or background) and start the python backend
CMD ["sh", "-c", "/usr/local/bin/start.sh"]