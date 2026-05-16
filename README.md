# VibeSpot: Social Discovery Platform with AI Features

VibeSpot is a full-stack social discovery platform for finding places, events, and hangout ideas. The project combines a `Next.js` frontend, a `Laravel` backend API, and a separate `FastAPI` AI microservice for personalized recommendations and conversational assistance.

This repository is prepared so it can be cloned on another device and set up again with local environment files and dependencies.

## Core Features

- Browse and search places and events
- User authentication with email/password and Google OAuth
- Wishlist, check-ins, profile activity, reviews, and admin management
- AI-powered recommendation pipeline for places and events
- AI assistant/chatbot backed by Gemini plus live app context
- Separate Python service for training and serving recommendation logic

## Tech Stack

- Frontend: `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS`, `Framer Motion`
- Backend: `Laravel 13`, `PHP 8.3`, `Sanctum`, `Socialite`
- AI Service: `FastAPI`, `SQLAlchemy`, `scikit-learn`, `pandas`
- Database: `PostgreSQL`

## Project Structure

```text
VibeSpot-Hangout-Platform/
|-- frontend/      # Next.js client app
|-- backend/       # Laravel REST API
|-- ai-service/    # FastAPI AI and recommendation service
|-- README.md
|-- .gitignore
```

## Architecture

The application runs as 3 services:

1. `frontend` on `http://localhost:3000`
2. `backend` on `http://127.0.0.1:8000`
3. `ai-service` on `http://127.0.0.1:8010`

The frontend talks to the Laravel API. The Laravel backend talks to the FastAPI AI service for recommendation and chatbot features.

## AI Features

### Recommendation Service

- Generates personalized place and event recommendations
- Uses a trained model stored in `ai-service/models/recommendation_model.pkl`
- Falls back to stored recommendations or popularity-based results when needed

### Chatbot Assistant

- Accepts user questions about places and events
- Uses Gemini for natural-language replies
- Combines live database context with recommendation signals
- Falls back to context-based suggestions if the Gemini call fails

## Prerequisites

Install these on the new device before setup:

- `Git`
- `Node.js 20+` and `npm`
- `PHP 8.3+`
- `Composer`
- `Python 3.11+`
- `PostgreSQL`

Windows users can use `Laragon` for a smoother local PHP/PostgreSQL workflow.

## Clone the Repository

```bash
git clone https://github.com/MasfiqurNehal/Social-Discovery-Platform-AI-features.git
cd Social-Discovery-Platform-AI-features
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan storage:link
```

Update `backend/.env` with your local database and integration values:

```env
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=vibespot_db
DB_USERNAME=postgres
DB_PASSWORD=your_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/auth/google/callback

FASTAPI_BASE_URL=http://127.0.0.1:8010
FASTAPI_TIMEOUT_SECONDS=30
FASTAPI_CONNECT_TIMEOUT_SECONDS=3
FASTAPI_TRAIN_TIMEOUT_SECONDS=180
FASTAPI_CHAT_TIMEOUT_SECONDS=40
GEMINI_API_KEY=your_gemini_api_key
```

Run database migrations and seeders:

```bash
php artisan migrate --seed
```

Start the Laravel backend:

```bash
php artisan serve
```

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
copy .env.example .env.local
```

Set the frontend environment values in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

### 3. AI Service Setup

Open another terminal:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `ai-service/.env`:

```env
AI_SERVICE_ENV=local
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8010
AI_SERVICE_RELOAD=true

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=vibespot_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSLMODE=prefer

RECOMMENDATION_DEFAULT_LIMIT=20
RECOMMENDATION_MAX_LIMIT=100

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_SECONDS=25
```

Start the AI service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

## Training the Recommendation Model

If the model is missing or you want to retrain it, use the AI service recommendation training endpoint after the backend database is ready. The application can still fall back to non-ML recommendations if needed.

## Useful URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:8000`
- AI Service Health: `http://127.0.0.1:8010/health`
- AI DB Health: `http://127.0.0.1:8010/health/db`
- AI Model Health: `http://127.0.0.1:8010/health/model`

## Notes

- Real `.env` files are not committed to GitHub
- Dependency folders like `node_modules`, `vendor`, and `.venv` are not committed
- If Google login or Gemini features are needed, use your own API credentials locally
- The repository includes source code and setup templates so it can be cloned and run again on another machine
