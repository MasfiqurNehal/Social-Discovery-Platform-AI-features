from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.db_connection import get_db
from services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    limit: int = Field(default=20, ge=1, le=100)


class TrainRequest(BaseModel):
    training_user_limit: int = Field(default=3000, ge=100, le=20000)
    user_offset: int = Field(default=0, ge=0)


@router.get("/users/{user_id}")
def get_user_recommendations(
    user_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = RecommendationService(db)
    rows = service.get_user_recommendations(user_id=user_id, limit=limit)
    return {"status": "success", "data": rows, "meta": {"limit": limit, "count": len(rows)}}


@router.get("/users/{user_id}/features")
def get_user_features(
    user_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = RecommendationService(db)
    payload = service.get_user_behavior_features(user_id=user_id, limit=limit)

    if payload is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"status": "success", "data": payload}


@router.post("/recommend")
def recommend(payload: RecommendRequest, db: Session = Depends(get_db)):
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


@router.post("/train")
def train(payload: TrainRequest, db: Session = Depends(get_db)):
    service = RecommendationService(db)
    result = service.train_model(
        training_user_limit=payload.training_user_limit,
        user_offset=payload.user_offset,
    )
    return {"status": "success", "data": result}
