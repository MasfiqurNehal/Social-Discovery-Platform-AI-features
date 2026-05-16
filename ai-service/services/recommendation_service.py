from __future__ import annotations

from pathlib import Path
import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from recommendation.predict import predict_recommendations
from recommendation.train_model import train_recommendation_model

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.model_path = Path(__file__).resolve().parent.parent / "models" / "recommendation_model.pkl"

    def get_user_recommendations(self, user_id: int, limit: int) -> list[dict]:
        safe_limit = min(max(limit, 1), settings.recommendation_max_limit)
        sql = text(
            """
            SELECT id, user_id, target_type, target_id, source_type, algorithm_version,
                   rank_score, reason, context, generated_at
            FROM recommendations
            WHERE user_id = :user_id
            ORDER BY generated_at DESC
            LIMIT :safe_limit
            """
        )

        rows = self.db.execute(sql, {"user_id": user_id, "safe_limit": safe_limit}).mappings().all()
        return [dict(row) for row in rows]

    def get_user_behavior_features(self, user_id: int, limit: int) -> dict | None:
        user_sql = text("SELECT id, display_name FROM users WHERE id = :user_id LIMIT 1")
        user_row = self.db.execute(user_sql, {"user_id": user_id}).mappings().first()
        if user_row is None:
            return None

        safe_limit = min(max(limit, 1), settings.recommendation_max_limit)

        ratings_sql = text(
            """
            SELECT score, COUNT(*) AS total
            FROM ratings
            WHERE user_id = :user_id
            GROUP BY score
            ORDER BY score DESC
            LIMIT :safe_limit
            """
        )

        recent_activity_sql = text(
            """
            SELECT action, created_at
            FROM activity_logs
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :safe_limit
            """
        )

        recent_searches_sql = text(
            """
            SELECT query, searched_at, result_count
            FROM search_histories
            WHERE user_id = :user_id
            ORDER BY searched_at DESC
            LIMIT :safe_limit
            """
        )

        ratings = self.db.execute(ratings_sql, {"user_id": user_id, "safe_limit": safe_limit}).mappings().all()
        activities = self.db.execute(recent_activity_sql, {"user_id": user_id, "safe_limit": safe_limit}).mappings().all()
        searches = self.db.execute(recent_searches_sql, {"user_id": user_id, "safe_limit": safe_limit}).mappings().all()

        return {
            "user": dict(user_row),
            "feature_version": "v2_ml_ready",
            "limits": {"requested": limit, "applied": safe_limit},
            "ratings_distribution": [dict(row) for row in ratings],
            "recent_activity": [dict(row) for row in activities],
            "recent_searches": [dict(row) for row in searches],
        }

    def train_model(self, training_user_limit: int = 3000, user_offset: int = 0) -> dict:
        return train_recommendation_model(
            db=self.db,
            training_user_limit=training_user_limit,
            user_offset=user_offset,
        )

    def _get_popular_fallback(self, limit: int) -> dict:
        """Return top-rated published places and events for cold-start users."""
        places_sql = text(
            """
            SELECT id AS target_id, 'place'::text AS target_type,
                   category, ROUND(COALESCE(average_rating::float, 0.0) / 5.0, 4) AS score
            FROM places
            WHERE is_published = true
            ORDER BY average_rating DESC NULLS LAST, total_reviews DESC
            LIMIT :limit
            """
        )
        events_sql = text(
            """
            SELECT id AS target_id, 'event'::text AS target_type,
                   category, ROUND(COALESCE(average_rating::float, 0.0) / 5.0, 4) AS score
            FROM events
            WHERE is_published = true
            ORDER BY average_rating DESC NULLS LAST, total_reviews DESC
            LIMIT :limit
            """
        )
        places = [dict(r) for r in self.db.execute(places_sql, {"limit": limit}).mappings()]
        events = [dict(r) for r in self.db.execute(events_sql, {"limit": limit}).mappings()]
        return {"places": places, "events": events}

    def recommend(self, user_id: int, limit: int) -> dict:
        safe_limit = min(max(limit, 1), settings.recommendation_max_limit)

        try:
            predictions = predict_recommendations(
                db=self.db,
                user_id=user_id,
                limit=safe_limit,
                model_path=self.model_path,
            )
            return {
                "user_id": user_id,
                "model_path": str(self.model_path),
                "places": predictions["places"],
                "events": predictions["events"],
            }
        except Exception as exc:
            logger.exception("ML recommendation prediction failed, falling back to stored recommendations", exc_info=exc)

        # Fallback 1: pre-stored recommendations from the DB
        fallback_rows = self.get_user_recommendations(user_id=user_id, limit=safe_limit)
        places = []
        events = []
        for row in fallback_rows:
            mapped = {
                "target_type": row.get("target_type"),
                "target_id": row.get("target_id"),
                "score": float(row.get("rank_score") or 0),
                "category": None,
            }
            if row.get("target_type") == "place":
                places.append(mapped)
            elif row.get("target_type") == "event":
                events.append(mapped)

        if places or events:
            return {
                "user_id": user_id,
                "model_path": str(self.model_path),
                "places": places[:safe_limit],
                "events": events[:safe_limit],
                "fallback": "stored_recommendations",
            }

        # Fallback 2: popularity-based cold-start for brand-new users with no history
        logger.info("No stored recommendations for user %d, using popularity cold-start fallback", user_id)
        pop = self._get_popular_fallback(safe_limit)
        return {
            "user_id": user_id,
            "model_path": str(self.model_path),
            "places": pop["places"],
            "events": pop["events"],
            "fallback": "popularity",
        }
