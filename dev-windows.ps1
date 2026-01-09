# Get the directory of the current script
$ScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location $ScriptDir

Write-Host "========================================" -ForegroundColor Green
Write-Host "JARVIS DEVELOPMENT SERVER STARTUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Start the frontend development server as a background job
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
$frontendJob = Start-Job { Set-Location $using:ScriptDir; npm run dev }

# Wait a moment for the frontend to start
Start-Sleep -Seconds 3

# Start the backend server in the main thread
Write-Host "Starting backend server..." -ForegroundColor Yellow
try {
    python start.py
} finally {
    # Stop the frontend job when backend stops
    Write-Host "Stopping development servers..." -ForegroundColor Yellow
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
}

Write-Host "Development servers stopped." -ForegroundColor Green