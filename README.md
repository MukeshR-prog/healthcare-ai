# Healthcare AI Fraud Detection

Full-stack healthcare claims analysis app with:
- FastAPI backend for ML and LLM-powered analysis
- React + Vite frontend dashboard for analytics and claim review
- CSV-based training and analytics data source

## What This Project Does

This project helps analyze healthcare claims and identify potential fraud by combining:
- A machine learning model (Random Forest) for fraud prediction
- LLM-generated summaries and explanations for claims
- A frontend dashboard for single-claim and batch workflows

## Tech Stack

Backend:
- Python
- FastAPI
- pandas, scikit-learn
- Groq API (Llama 3.1 model)

Frontend:
- React 19
- Vite
- Axios
- Recharts
- Zustand
- Tailwind CSS 4 + Radix UI primitives

## Project Structure

```text
app/
  main.py                # FastAPI app and CORS setup
  api/routes.py          # API endpoints
  core/config.py         # Environment/config values
  services/ml_service.py # Model training and fraud prediction
  services/llm_service.py# Summary and explanation using Groq

data/
  claims.csv             # Training + analytics dataset

frontend/
  src/                   # React app
  package.json           # Frontend scripts/deps
```

## Prerequisites

- Python 3.11+ (recommended)
- Node.js 18+ and npm
- A Groq API key

## Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Notes:
- Endpoints that use LLM features (`/summarize`, `/analyze`) require `GROQ_API_KEY`.
- The ML-only endpoints (`/predict`, `/batch-analyze`, `/analytics`) do not require the key.

## Backend Setup (FastAPI)

From the project root:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:
- `http://127.0.0.1:8000`

Health check:
- `GET /` returns `{"message": "Healthcare AI API Running"}`

## Frontend Setup (React + Vite)

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at:
- `http://localhost:5173`

The backend CORS policy currently allows:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

## API Endpoints

Base URL: `http://127.0.0.1:8000`

- `GET /`
  - API status message

- `POST /predict`
  - Input: one claim object
  - Output: `fraud_prediction` with `prediction` and `confidence`

- `POST /summarize`
  - Input: `{ "text": "..." }`
  - Output: claim summary text from LLM

- `POST /analyze`
  - Input: one claim object
  - Output: ML prediction + confidence + LLM explanation + summary

- `POST /batch-analyze`
  - Input: array of claim objects
  - Output: per-claim prediction results

- `GET /analytics`
  - Output: total claims, average claim amount, and fraud cases from CSV

## Claim Payload Shape

Typical claim fields used by the model:

```json
{
  "Provider": "C",
  "Age": 51,
  "ClaimAmount": 47475,
  "NumProcedures": 1,
  "Gender": "F"
}
```

## How Prediction Works

1. `data/claims.csv` is loaded at startup.
2. Categorical columns are one-hot encoded.
3. RandomForestClassifier is trained in memory.
4. Incoming claims are transformed to match training columns.
5. Response includes:
   - `prediction` (0 or 1)
   - `confidence` (fraud probability)

## Troubleshooting

- If LLM requests fail:
  - Verify `GROQ_API_KEY` in `.env`
  - Restart backend after changing environment variables

- If frontend cannot reach backend:
  - Confirm backend is running on port 8000
  - Check frontend uses `http://127.0.0.1:8000` (see `frontend/src/services/api.js`)

- If PowerShell blocks venv activation:
  - Run PowerShell as admin and set execution policy if needed:
  - `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

## Future Improvements

- Persist trained model instead of retraining at startup
- Add request/response schemas with Pydantic models
- Add model evaluation metrics endpoint
- Add automated tests for API and frontend integration
- Support file upload endpoint for batch CSV processing
