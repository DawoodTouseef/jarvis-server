Write-Host "Starting Jarvis Server with Docker..." -ForegroundColor Green

# Check if Docker is running
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        Pause
        Exit 1
    }
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Pause
    Exit 1
}

# Create data directory if it doesn't exist
if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Name "data" | Out-Null
}

# Start the services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Jarvis Server is starting..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at: http://localhost:8080" -ForegroundColor White
Write-Host "View logs with: docker-compose logs -f" -ForegroundColor White
Write-Host "Stop with: docker-compose down" -ForegroundColor White
Write-Host ""

# Optionally open browser
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:8080"

Pause