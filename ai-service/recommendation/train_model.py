from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sqlalchemy.orm import Session

from recommendation.preprocessing import RecommendationPreprocessor

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "recommendation_model.pkl"

FEATURE_COLUMNS = [
    "rating_count",
    "avg_rating_given",
    "review_count",
    "wishlist_count",
    "booking_count",
    "search_count",
    "avg_search_results",
    "checkin_count",
    "activity_count",
    "popularity_all",
    "popularity_30d",
    "item_avg_rating",
    "user_category_interest",
    "category_match",
    "is_event",
    "trend_ratio",
]


def train_recommendation_model(
    db: Session,
    training_user_limit: int = 3000,
    user_offset: int = 0,
    max_positive_per_user: int = 40,
    max_negative_per_user: int = 60,
    random_state: int = 42,
) -> dict:
    preprocessor = RecommendationPreprocessor(db)
    user_ids = preprocessor.get_active_user_ids(limit=training_user_limit, offset=user_offset)

    if not user_ids:
        raise ValueError("No active users found for training.")

    user_bundle = preprocessor.build_user_features(user_ids)
    pairs_df = preprocessor.build_training_pairs(
        user_ids=user_ids,
        max_positive_per_user=max_positive_per_user,
        max_negative_per_user=max_negative_per_user,
    )

    if pairs_df.empty:
        raise ValueError("No training interactions were assembled.")

    target_pairs = list(zip(pairs_df["target_type"].tolist(), pairs_df["target_id"].astype(int).tolist()))
    item_df = preprocessor.build_item_features(target_pairs)
    feature_df = preprocessor.assemble_feature_frame(pairs_df, user_bundle, item_df)

    if feature_df.empty:
        raise ValueError("Feature engineering produced an empty dataset.")

    X = feature_df[FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    y = feature_df["label"].to_numpy(dtype=np.int32)

    if len(np.unique(y)) < 2:
        raise ValueError("Training labels need both positive and negative classes.")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=random_state,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=16,
        min_samples_split=10,
        min_samples_leaf=5,
        n_jobs=-1,
        class_weight="balanced_subsample",
        random_state=random_state,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "feature_columns": FEATURE_COLUMNS,
            "metadata": {
                "training_user_limit": training_user_limit,
                "user_offset": user_offset,
                "samples": int(len(feature_df)),
                "positives": int((feature_df["label"] == 1).sum()),
                "negatives": int((feature_df["label"] == 0).sum()),
            },
        },
        MODEL_PATH,
    )

    return {
        "status": "success",
        "model_path": str(MODEL_PATH),
        "trained_users": len(user_ids),
        "samples": int(len(feature_df)),
        "positive_samples": int((feature_df["label"] == 1).sum()),
        "negative_samples": int((feature_df["label"] == 0).sum()),
        "metrics": {
            "accuracy": float(report.get("accuracy", 0.0)),
            "f1_positive": float(report.get("1", {}).get("f1-score", 0.0)),
            "precision_positive": float(report.get("1", {}).get("precision", 0.0)),
            "recall_positive": float(report.get("1", {}).get("recall", 0.0)),
        },
    }


if __name__ == "__main__":
    from database.db_connection import SessionLocal

    with SessionLocal() as session:
        result = train_recommendation_model(session)
        print(result)
