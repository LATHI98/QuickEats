param(
    [string]$PythonPath = "D:\venvs\qeai\Scripts\python.exe",
    [string]$BackendCrowdUrl = "http://localhost:5000/api/crowd",
    [switch]$SkipInstall,
    [switch]$ForceStart,
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[QuickEats AI] $Message"
}

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $scriptDir

    Write-Step "Using AI directory: $scriptDir"

    if (-not (Test-Path $PythonPath)) {
        throw "Python executable not found at: $PythonPath"
    }

    if (-not $SkipInstall) {
        Write-Step "Installing or updating dependencies from requirements.txt"
        & $PythonPath -m pip install --no-cache-dir -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            throw "Dependency installation failed."
        }
    }

    Write-Step "Running quick import check"
    & $PythonPath -c "import cv2, requests; from ultralytics import YOLO; print('ai-ready')"
    if ($LASTEXITCODE -ne 0) {
        throw "Python import check failed."
    }

    Write-Step "Checking backend crowd endpoint: $BackendCrowdUrl"
    try {
        $null = Invoke-RestMethod -Uri $BackendCrowdUrl -Method Get -TimeoutSec 5
        Write-Step "Backend check passed."
    }
    catch {
        if ($ForceStart) {
            Write-Warning "Backend health check failed, but continuing because -ForceStart was provided."
        }
        else {
            throw "Backend health check failed. Start backend first or use -ForceStart to continue."
        }
    }

    if ($CheckOnly) {
        Write-Step "Check-only mode complete."
        exit 0
    }

    Write-Step "Starting crowd detector (press q in the video window to quit)"
    & $PythonPath crowd_detector.py
    exit $LASTEXITCODE
}
catch {
    Write-Error $_
    exit 1
}
