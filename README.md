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

### Authentication Endpoints

- `POST /register`
  - Create a new user account
  - Body: `{ "email": "user@example.com", "password": "secret123" }`
  - Returns: `{ "access_token": "jwt_token", "user_id": "mongo_id", "email": "..." }`

- `POST /login`
  - Authenticate existing user
  - Body: `{ "email": "user@example.com", "password": "secret123" }`
  - Returns: auth token and user info

- `POST /forgot-password`
  - Request password reset email
  - Body: `{ "email": "user@example.com" }`

- `POST /reset-password`
  - Complete password reset flow
  - Body: `{ "token": "reset_token", "new_password": "newpass123" }`

### Claim Analysis Endpoints

- `GET /`
  - Health/status check
  - Returns: `{ "message": "Healthcare AI API Running" }`

- `POST /predict` (unprotected)
  - Single claim ML prediction only (no persistence)
  - Body: Claim object with fields: `provider`, `age`, `claim_amount`, `num_procedures`, `gender`
  - Returns: `{ "fraud_prediction": { "prediction": 0/1, "confidence": 0.95 }, "claim_id": "...", "prediction_id": "..." }`

- `POST /summarize` (unprotected)
  - Generate LLM summary for claim text
  - Body: `{ "text": "claim description..." }`
  - Returns: `{ "summary": "..." }`

- `POST /analyze` (protected)
  - Complete claim analysis with ML prediction, anomaly detection, and LLM explanation
  - Body: Claim object
  - Returns: Prediction with confidence, anomaly score, explanation, summary, and persistence IDs
  - Header: `Authorization: Bearer {access_token}`

- `POST /batch-analyze`
  - Analyze multiple claims in one request
  - Body: Array of claim objects
  - Returns: Array of prediction results with persistence

- `POST /upload-csv` (protected)
  - Upload CSV file for batch processing
  - Multipart form with file upload
  - Returns: Summary of processed rows and any errors

### History & Analytics

- `GET /history` (protected)
  - Get authenticated user's claim/prediction history
  - Returns: Paginated list of claims with latest predictions
  - Header: `Authorization: Bearer {access_token}`

- `GET /history/{id}` (protected)
  - Get detailed history for specific claim prediction
  - Returns: Full claim data with all prediction details

- `GET /model-metrics`
  - ML model performance metrics
  - Returns: Accuracy, precision, recall, F1, confusion matrix, feature importance rankings

- `GET /analytics`
  - Dashboard analytics aggregates
  - Returns: Total claims, fraud rate, average claim amount by provider, gender distribution, high-risk count

## Frontend Pages

All protected pages require login. Features include:

### `/dashboard`
- Real-time fraud monitoring command center
- Metric cards: Total claims, fraud cases, fraud rate, high-risk alerts
- Charts: Fraud distribution pie chart, claim trends over time
- Recent claims table with latest predictions
- Analytics aggregates updated on load

### `/analyze`
- Single-claim analysis form
- Input fields for all required claim data
- Real-time prediction results with confidence score
- LLM-generated explanation of fraud risk
- Claim summary and persistence confirmation

### `/batch-upload`
- CSV file upload interface
- Row-by-row prediction ingestion
- Progress tracking for batch processing
- Results table with all predictions
- Error handling and validation feedback

### `/history`
- User's complete claim history
- Detailed view of each claim with all predictions
- Result cards showing prediction details and explanations
- Filterable and sortable history table

### `/analytics`
- Provider-level fraud statistics
- Gender distribution breakdown
- High-risk claim concentration
- Average claim amounts by provider
- Interactive charts with drill-down capability

## Troubleshooting

### Backend Issues

- Backend not reachable:
  - Verify FastAPI is running: `GET http://127.0.0.1:8000`
  - Check port 8000 is not in use: `netstat -ano | findstr :8000` (Windows)
  - Confirm `MONGO_URI` points to running MongoDB instance

- MongoDB connection error:
  - Ensure MongoDB service is running: `mongod` (local) or check Atlas cluster status
  - Verify `MONGO_URI` format: `mongodb://127.0.0.1:27017` (local) or Atlas connection string
  - Test connection: `mongo mongodb://localhost:27017` from PowerShell

- Auth token expired (`401` error):
  - Re-login to get a fresh token
  - Token lifetime configured via `ACCESS_TOKEN_EXPIRE_MINUTES` env variable (default: 60 mins)

- LLM requests fail (no summary/explanation):
  - Verify `GROQ_API_KEY` in `.env` file
  - Check API key is valid at https://console.groq.com
  - Restart backend after updating env variables: `uvicorn app.main:app --reload`

### Frontend Issues

- Login redirect loop:
  - Clear browser localStorage: DevTools > Application > Local Storage > Clear All
  - Check `access_token` is being saved after login

- API requests fail with 403:
  - Ensure `Authorization: Bearer {token}` header is being sent
  - Check token in `useStore.js` is being set correctly on login

- Charts/tables show no data:
  - Verify claims exist in MongoDB: `db.claims.countDocuments({})`
  - Check user owns the claims (created by their user_id)
  - Try fetching analytics with network tab open to see actual response

- Theme not persisting:
  - Theme mode is stored in Zustand store: `frontend/src/store/useStore.js`
  - Clear localStorage and reload to reset theme to system default

### System Issues

- PowerShell execution policy blocks venv activation:
  - Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
  - Or use Command Prompt (cmd.exe) instead: `venv\Scripts\activate.bat`

- Port already in use:
  - Backend: Change port with `uvicorn app.main:app --port 8001 --reload`
  - Frontend: Change port with `npm run dev -- --port 5174`

## Current Status

This project already includes:
- database persistence with MongoDB,
- full authentication and protected multi-user flows,
- batch CSV upload + analytics aggregations,
- production-style SaaS frontend with theming,
- responsive design and dark/light modes,
- model metrics and performance tracking,
- anomaly detection for pattern flagging,
- and user-scoped data isolation.

## Database Models

### users
Stores user account information:
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "password": "hashed_password",
  "rawpassword": "encrypted_plaintext",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### claims
Stores submitted healthcare claims:
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId_ref_to_users",
  "provider": "A",
  "age": 45,
  "claim_amount": 25000,
  "num_procedures": 3,
  "gender": "M",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### predictions
Stores ML predictions and LLM explanations:
```json
{
  "_id": "ObjectId",
  "claim_id": "ObjectId_ref_to_claims",
  "user_id": "ObjectId_ref_to_users",
  "prediction": 1,
  "confidence": 0.87,
  "anomaly_score": -0.15,
  "is_anomalous": false,
  "explanation": "LLM generated explanation...",
  "summary": "LLM generated summary...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Key Architecture Decisions

1. **User-Scoped Data**: All analysis endpoints filter by `current_user["id"]` to ensure data isolation
2. **Stateless Auth**: JWT tokens enable scalability without session storage
3. **Separation of Concerns**: ML service, LLM service, and DB operations are decoupled
4. **Batch Processing**: CSV upload allows bulk analysis in single request
5. **Incremental Results**: Predictions are saved immediately for audit trail
6. **Anomaly as Separate Signal**: Isolated from fraud model for flexibility in interpretati
