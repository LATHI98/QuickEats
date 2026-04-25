# Crowd Monitoring AI Service

This service uses YOLOv8 and OpenCV to detect people from the laptop webcam and send crowd count updates to the backend every 2 seconds.

## Recommended setup on Windows (Python 3.13)

Use a short-path virtual environment to avoid long-path installation issues with PyTorch.

1. Create the virtual environment:

```powershell
py -3.13 -m venv D:\venvs\qeai
```

2. Install dependencies into that venv:

```powershell
D:\venvs\qeai\Scripts\python -m pip install --upgrade pip setuptools wheel
D:\venvs\qeai\Scripts\python -m pip install --no-cache-dir -r requirements.txt
```

## Start backend API first

From QuickEats/backend:

```powershell
npm install
npm start
```

## Run AI detector

From QuickEats/ai:

```powershell
D:\venvs\qeai\Scripts\python crowd_detector.py
```

## One-command launcher (recommended)

You can run the detector through a helper script that checks dependencies, validates imports, and verifies backend availability before camera inference starts.

```powershell
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1
```

Useful options:

```powershell
# Validate setup and backend without opening the camera
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1 -CheckOnly

# Skip dependency installation step
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1 -SkipInstall

# Start even if backend health check fails
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1 -ForceStart
```

## Notes

- The script counts YOLO class 0 (person).
- POST target is http://localhost:5000/api/crowd.
- Press q in the OpenCV window to stop.
- If you hit low disk space while installing, free space on C: and keep using --no-cache-dir.
