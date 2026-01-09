#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR" || exit

echo "========================================"
echo "JARVIS DEVELOPMENT SERVER STARTUP"
echo "========================================"

# Function to clean up background processes on exit
cleanup() {
    echo "Stopping development servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap exit signals to clean up
trap cleanup EXIT INT TERM

# Start the frontend development server in the background
echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for the frontend to start
sleep 3

# Start the backend server in the foreground
echo "Starting backend server..."
python start.py

# If we reach here, the backend has stopped
echo "Backend server stopped."