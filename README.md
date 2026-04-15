# Healthcare AI Fraud Detection Platform

End-to-end fraud analysis platform for healthcare claims with a FastAPI backend, MongoDB persistence, machine-learning scoring, LLM explanations, and a SaaS-style React dashboard.

## Implemented Features

### Backend
- MongoDB-backed persistence for users, claims, and predictions.
- Modular API routing split by domain:
  - `app/api/auth_routes.py`
  - `app/api/claim_routes.py`
  - `app/api/history_routes.py`
  - `app/api/analytics_routes.py`
- JWT authentication and route protection.
- User-scoped data access (`/analyze`, `/history`, `/history/{id}`, `/upload-csv` return only the authenticated user's data).
- CSV batch upload and row-by-row prediction ingestion.
- ML model evaluation endpoint with accuracy, precision, recall, F1 score, feature importance, and model artifact metadata.
- Enriched analytics endpoint with fraud rate, provider averages, gender distribution, and high-risk counts.

### Frontend
- Protected app shell with auth flow (`/login`, `/register`) and route guarding.
- Public marketing landing page (`/`).
- SaaS dashboard pages:
  - Dashboard
  - Analyze claim
  - Batch upload
  - Analytics
  - History
- Reusable chart/card/table/form component architecture.
- Table pagination support for key data views.
- Indian currency formatting (`INR`) in UI display utilities.
- Theme system with `light`, `dark`, and `system` modes.
- Fixed desktop sidebar + independently scrollable main content area.
- Mobile-responsive navigation and layout behavior.

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Pydantic v2
- PyMongo (MongoDB)
- scikit-learn, pandas, numpy
- PyJWT, bcrypt, cryptography
- Uvicorn

### Frontend
- React 19 + Vite
- React Router
- Zustand
- Axios
- Recharts
- Tailwind CSS 4
- Radix UI primitives
- Framer Motion

## Repository Structure

```text
app/
  main.py
  api/
    routes.py              # Router aggregator
    auth_routes.py
    claim_routes.py
    history_routes.py
    analytics_routes.py
    route_utils.py         # Shared helpers (save/serialize/history pipeline)
  core/
    config.py
  db/
    connection.py
    init_db.py
  models/
    user.py
    claim.py
    prediction.py
  schemas/
    auth.py
    claim.py
    prediction.py
    history.py
  services/
    auth_service.py
    ml_service.py
    llm_service.py

data/
  claims.csv

frontend/
  src/
    App.jsx
    layouts/
    pages/
    components/
    store/
    hooks/
    services/
    utils/
```

## Environment Variables

Create a `.env` file in project root:

```env
GROQ_API_KEY=your_groq_api_key
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=healthcare_ai
JWT_SECRET_KEY=change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
RESET_TOKEN_EXPIRE_MINUTES=30
RAW_PASSWORD_ENCRYPTION_KEY=optional-separate-key
```

Notes:
- LLM-based endpoints (`/summarize`, `/analyze`) require `GROQ_API_KEY`.
- Protected endpoints require bearer token from `/register` or `/login`.
- Ensure MongoDB service is running before backend startup.

## Local Setup

### 1) Backend

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

### 2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## API Summary

Base URL: `http://127.0.0.1:8000`

- `GET /`
  - Health/status response.

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
  - Authentication and password recovery flow.

- `POST /predict`
  - Single claim prediction (unprotected).

- `POST /summarize`
  - LLM summary for free text.

- `POST /analyze`
  - Protected single-claim analysis with ML + explanation + summary + persistence.

- `POST /batch-analyze`
  - Batch analysis from JSON claim array.

- `POST /upload-csv`
  - Protected CSV upload and batch persistence.

- `GET /history`
- `GET /history/{id}`
  - Protected, user-scoped claim/prediction history.

- `GET /model-metrics`
  - Model performance metrics and feature importance.

- `GET /analytics`
  - Dashboard analytics aggregates.

## Frontend Routes

- Public:
  - `/` (landing page)
  - `/login`
  - `/register`
- Protected:
  - `/dashboard`
  - `/analyze`
  - `/batch-upload`
  - `/analytics`
  - `/history`

## Troubleshooting

- Backend not reachable:
  - Verify backend is running at port `8000`.
  - Check frontend API base URL in `frontend/src/services/api.js`.

- Auth issues (`401/403`):
  - Ensure token is present and not expired.
  - Re-login to refresh persisted auth state.

- Theme mismatch:
  - Theme mode is managed in `frontend/src/store/useStore.js` and applied in `frontend/src/App.jsx`.

- PowerShell execution policy blocks venv activation:
  - `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

## Current Status

This project already includes:
- database persistence,
- authentication and protected multi-user flows,
- batch upload + analytics,
- production-style frontend shell,
- responsive design and theming,
- and model metrics support.
