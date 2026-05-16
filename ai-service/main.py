import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.db_connection import check_db_connection, get_db
from routes.chatbot_routes import router as chatbot_router
from routes.recommendation_routes import router as recommendation_router
from services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parent / "models" / "recommendation_model.pkl"


@asynccontextmanager
async def lifespan(app: FastAPI):
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.exists():
        logger.info("Recommendation model loaded from %s", MODEL_PATH)
    else:
        logger.warning(
            "No trained model found at %s. "
            "POST /api/v1/recommendations/train to train the model. "
            "Serving popularity-based fallback recommendations until then.",
            MODEL_PATH,
        )
    yield


app = FastAPI(
    title="VibeSpot AI Service",
    description="FastAPI microservice foundation for recommendations and ML workflows.",
    version="0.1.0",
    lifespan=lifespan,
)


class RecommendRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    limit: int = Field(default=20, ge=1, le=100)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/health/db")
def health_db() -> dict:
    check_db_connection()
    return {"status": "ok", "database": "connected"}


@app.get("/health/model")
def health_model() -> dict:
    exists = MODEL_PATH.exists()
    return {
        "status": "ok" if exists else "untrained",
        "model_exists": exists,
        "path": str(MODEL_PATH),
        "message": "Model ready." if exists else "No trained model. POST /api/v1/recommendations/train to train.",
    }


@app.post("/recommend")
def recommend_root(payload: RecommendRequest, db: Session = Depends(get_db)):
    service = RecommendationService(db)
    data = service.recommend(user_id=payload.user_id, limit=payload.limit)
    return {
        "status": "success",
        "data": data,
        "meta": {
            "requested_limit": payload.limit,
            "returned_places": len(data["places"]),
            "returned_events": len(data["events"]),
        },
    }


app.include_router(recommendation_router, prefix="/api/v1")
app.include_router(chatbot_router, prefix="/api/v1")
