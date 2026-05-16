from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from recommendation.preprocessing import RecommendationPreprocessor
from recommendation.train_model import FEATURE_COLUMNS

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "recommendation_model.pkl"


def load_model_bundle(model_path: Path = MODEL_PATH) -> dict:
    if not model_path.exists():
        raise FileNotFoundError(f"Trained model not found at {model_path}")
    return joblib.load(model_path)


def predict_recommendations(
    db: Session,
    user_id: int,
    limit: int = 20,
    candidate_pool_size: int = 250,
    model_path: Path = MODEL_PATH,
) -> dict:
    bundle = load_model_bundle(model_path)
    model = bundle["model"]
    feature_columns: list[str] = bundle.get("feature_columns", FEATURE_COLUMNS)

    preprocessor = RecommendationPreprocessor(db)
    user_bundle = preprocessor.build_user_features([user_id])

    if user_bundle.users_df.empty:
        return {"places": [], "events": []}

    scored_frames: list[pd.DataFrame] = []

    for target_type in ["place", "event"]:
        candidates_df = preprocessor.build_prediction_candidates(
            user_id=user_id,
            target_type=target_type,
            candidate_limit=max(limit * 4, candidate_pool_size),
        )
        if candidates_df.empty:
            continue

        item_pairs = list(zip(candidates_df["target_type"].tolist(), candidates_df["target_id"].astype(int).tolist()))
        item_df = preprocessor.build_item_features(item_pairs)

        pairs_df = candidates_df.copy()
        pairs_df["user_id"] = user_id
        pairs_df["label"] = 0

        feature_df = preprocessor.assemble_feature_frame(pairs_df, user_bundle, item_df)
        if feature_df.empty:
            continue

        X = feature_df[feature_columns].to_numpy(dtype=np.float32)
        probabilities = model.predict_proba(X)[:, 1]

        feature_df = feature_df[["target_type", "target_id", "category"]].copy()
        feature_df["score"] = probabilities
        scored_frames.append(feature_df)

    if not scored_frames:
        return {"places": [], "events": []}

    scored = pd.concat(scored_frames, ignore_index=True)

    places = (
        scored[scored["target_type"] == "place"]
        .sort_values("score", ascending=False)
        .head(limit)
        .to_dict("records")
    )
    events = (
        scored[scored["target_type"] == "event"]
        .sort_values("score", ascending=False)
        .head(limit)
        .to_dict("records")
    )

    return {"places": places, "events": events}


if __name__ == "__main__":
    from database.db_connection import SessionLocal

    with SessionLocal() as session:
        print(predict_recommendations(session, user_id=1, limit=10))
