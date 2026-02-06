# Start both backend and frontend servers
Write-Host "Starting Aegis-G Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend (FastAPI) on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\CyberSec Project"
    $env:PYTHONPATH = "C:\CyberSec Project"
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
}

# Start Frontend  
Write-Host "Starting Frontend (Next.js) on http://localhost:3000..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\CyberSec Project\frontend"
    npm run dev
}

Write-Host ""
Write-Host "Both servers are starting in the background." -ForegroundColor Green
Write-Host "To view backend logs: Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor Gray
Write-Host "To view frontend logs: Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor Gray
Write-Host "To stop servers: Stop-Job -Id $($backendJob.Id),$($frontendJob.Id); Remove-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitoring logs (Press Ctrl+C to stop)..." -ForegroundColor Cyan

# Monitor both jobs
try {
    while ($true) {
        $backendOutput = Receive-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        $frontendOutput = Receive-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
        
        if ($backendOutput) {
            Write-Host "[BACKEND] $backendOutput" -ForegroundColor Blue
        }
        if ($frontendOutput) {
            Write-Host "[FRONTEND] $frontendOutput" -ForegroundColor Magenta
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id,$frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id,$frontendJob.Id -ErrorAction SilentlyContinue
}

