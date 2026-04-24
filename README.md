# QuickEats

QuickEats is a full-stack canteen management system with a React frontend, Node.js/Express backend, MongoDB database, and an AI-based crowd monitoring module.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express + MongoDB (Mongoose)
- AI Service: Python + OpenCV + YOLOv8

## Project Structure

```text
QuickEats/
	ai/
	backend/
	frontend/
```

## Crowd Monitoring Feature

The crowd monitoring flow works like this:

1. AI service reads webcam frames in real time.
2. YOLOv8 detects people (class person).
3. People count is sent to backend every 2 seconds via POST /api/crowd.
4. Backend stores count and timestamp in MongoDB.
5. Frontend polls GET /api/crowd every 2 seconds and shows:
	 - Current people count
	 - Crowd status:
		 - Low: 0-20
		 - Medium: 21-50
		 - High: 51+

## Backend API (Crowd)

- POST /api/crowd
	- Body: { "count": Number, "timestamp": Date string (optional) }
- GET /api/crowd
	- Returns latest crowd entry

## Setup

## 1) Backend

```powershell
cd backend
npm install
npm start
```

## 2) Frontend

```powershell
cd frontend
npm install
npm start
```

## 3) AI Service (Windows Recommended)

Use the short-path virtual environment already validated in this repo:

```powershell
py -3.13 -m venv D:\venvs\qeai
D:\venvs\qeai\Scripts\python -m pip install --upgrade pip setuptools wheel
cd ai
D:\venvs\qeai\Scripts\python -m pip install --no-cache-dir -r requirements.txt
```

Run AI detector:

```powershell
cd ai
D:\venvs\qeai\Scripts\python crowd_detector.py
```

Or use one-command launcher with health checks:

```powershell
cd ai
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1
```

Useful launcher options:

```powershell
# Validate dependencies/imports/backend only
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1 -CheckOnly

# Skip pip install phase
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1 -SkipInstall

# Start detector even if backend health check fails
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1 -ForceStart
```

## Frontend Route for Crowd View

- Student dashboard route: /dashboard/crowd

## Notes

- Press q in the OpenCV window to stop AI detection.
- If pip install fails due low disk space, free space on C: and use --no-cache-dir.
- If you use Python from Microsoft Store, short-path venv helps avoid long path package install issues.
