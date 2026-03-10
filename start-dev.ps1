# ============================================================
# Aegis-G — Development Startup Script
# Starts Backend (FastAPI) and Frontend (Next.js) together
# ============================================================

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Aegis-G Development Server Startup" -ForegroundColor Cyan
Write-Host "  Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Load environment from .env if it exists ─────────────────
$EnvFile = Join-Path $ProjectRoot ".env"
if (Test-Path $EnvFile) {
    Write-Host "Loading .env configuration..." -ForegroundColor Gray
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
} else {
    Write-Host "No .env found — using defaults (SQLite + no Gemini key)" -ForegroundColor Yellow
    $env:DATABASE_URL = "sqlite:///./aegis_dev.db"
    $env:SECRET_KEY   = "dev-secret-key-change-in-production-32ch"
    $env:GEMINI_API_KEY = ""
    $env:ENVIRONMENT  = "development"
}

$env:PYTHONPATH = $ProjectRoot

# ── Start Backend ────────────────────────────────────────────
Write-Host "Starting Backend (FastAPI) on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location $root
    $env:PYTHONPATH = $root
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
} -ArgumentList $ProjectRoot

# ── Start Frontend ───────────────────────────────────────────
Write-Host "Starting Frontend (Next.js) on http://localhost:3000 ..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $FrontendDir

Write-Host ""
Write-Host "Both servers starting in the background." -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000  |  API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers." -ForegroundColor Gray
Write-Host ""

# ── Stream logs from both jobs ───────────────────────────────
try {
    while ($true) {
        $backendOutput  = Receive-Job -Id $backendJob.Id  -ErrorAction SilentlyContinue
        $frontendOutput = Receive-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue

        if ($backendOutput) {
            $backendOutput -split "`n" | ForEach-Object {
                if ($_ -match "ERROR") {
                    Write-Host "[BACKEND] $_" -ForegroundColor Red
                } elseif ($_ -match "WARNING") {
                    Write-Host "[BACKEND] $_" -ForegroundColor Yellow
                } else {
                    Write-Host "[BACKEND] $_" -ForegroundColor Blue
                }
            }
        }
        if ($frontendOutput) {
            $frontendOutput -split "`n" | ForEach-Object {
                Write-Host "[FRONTEND] $_" -ForegroundColor Magenta
            }
        }

        # Exit if jobs die unexpectedly
        if ($backendJob.State -eq "Failed") {
            Write-Host "[BACKEND] Job failed! Check errors above." -ForegroundColor Red
            break
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Job  -Id $backendJob.Id,$frontendJob.Id  -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id,$frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}
