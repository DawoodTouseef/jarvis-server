# Concurrent Development Scripts

This project provides multiple ways to run both the frontend and backend development servers concurrently.

## Available Scripts

### 1. NPM Script (Cross-platform)
```bash
npm run dev:concurrent
```
This uses the `concurrently` package to run both servers. Make sure to install dependencies first:
```bash
npm install
```

### 2. Windows Batch File
```cmd
dev-windows.bat
```
This Windows batch script starts both servers and manages their lifecycle.

### 3. Windows PowerShell Script
```powershell
.\dev-windows.ps1
```
A more robust PowerShell alternative for Windows environments.

### 4. Shell Script (Unix/Linux/macOS)
```bash
./dev-concurrent.sh
```
A cross-platform shell script for Unix-like systems.

## How They Work

All scripts will:
1. Start the frontend development server (`npm run dev`) in the background
2. Start the backend server (`python start.py`) in the foreground
3. When you stop the backend server (Ctrl+C), it will automatically terminate the frontend server as well

## Prerequisites

- Node.js and npm installed
- Python 3.11+ installed
- All project dependencies installed (`npm install` and `pip install -r requirements.txt`)

## Troubleshooting

If you encounter issues:
1. Make sure all dependencies are installed
2. Ensure ports 3000 (frontend) and 8080 (backend) are available
3. On Windows, you might need to enable script execution for PowerShell scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```