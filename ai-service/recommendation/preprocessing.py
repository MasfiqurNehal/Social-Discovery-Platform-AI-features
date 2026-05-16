from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Session
from sqlalchemy.types import Integer, Text


@dataclass
class UserFeatureBundle:
    users_df: pd.DataFrame
    preference_df: pd.DataFrame


class RecommendationPreprocessor:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_active_user_ids(self, limit: int = 3000, offset: int = 0) -> list[int]:
        sql = text(
            """
            SELECT u.id
            FROM users u
            WHERE u.is_active = true
              AND (
                    EXISTS (SELECT 1 FROM ratings r WHERE r.user_id = u.id)
                 OR EXISTS (SELECT 1 FROM reviews rv WHERE rv.user_id = u.id)
                 OR EXISTS (SELECT 1 FROM wishlist_items w WHERE w.user_id = u.id)
                 OR EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.id)
                 OR EXISTS (SELECT 1 FROM activity_logs a WHERE a.user_id = u.id)
                 OR EXISTS (SELECT 1 FROM search_histories s WHERE s.user_id = u.id)
                 OR EXISTS (SELECT 1 FROM check_ins c WHERE c.user_id = u.id)
              )
            ORDER BY u.id
            LIMIT :limit OFFSET :offset
            """
        )
        rows = self.db.execute(sql, {"limit": limit, "offset": offset}).scalars().all()
        return [int(x) for x in rows]

    def build_user_features(self, user_ids: list[int]) -> UserFeatureBundle:
        if not user_ids:
            return UserFeatureBundle(pd.DataFrame(), pd.DataFrame())

        users_sql = text(
            """
            WITH base_users AS (
                SELECT unnest(:user_ids) AS user_id
            )
            SELECT
                bu.user_id,
                COALESCE(r.rating_count, 0) AS rating_count,
                COALESCE(r.avg_rating_given, 0.0) AS avg_rating_given,
                COALESCE(rv.review_count, 0) AS review_count,
                COALESCE(w.wishlist_count, 0) AS wishlist_count,
                COALESCE(b.booking_count, 0) AS booking_count,
                COALESCE(s.search_count, 0) AS search_count,
                COALESCE(s.avg_search_results, 0.0) AS avg_search_results,
                COALESCE(c.checkin_count, 0) AS checkin_count,
                COALESCE(a.activity_count, 0) AS activity_count
            FROM base_users bu
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS rating_count, AVG(score)::float AS avg_rating_given
                FROM ratings
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) r ON r.user_id = bu.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS review_count
                FROM reviews
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) rv ON rv.user_id = bu.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS wishlist_count
                FROM wishlist_items
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) w ON w.user_id = bu.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS booking_count
                FROM bookings
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) b ON b.user_id = bu.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS search_count, AVG(result_count)::float AS avg_search_results
                FROM search_histories
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) s ON s.user_id = bu.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS checkin_count
                FROM check_ins
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) c ON c.user_id = bu.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS activity_count
                FROM activity_logs
                WHERE user_id = ANY(:user_ids)
                GROUP BY user_id
            ) a ON a.user_id = bu.user_id
            """
        ).bindparams(bindparam("user_ids", type_=ARRAY(Integer)))

        pref_sql = text(
            """
            WITH interactions AS (
                SELECT r.user_id, 'place'::text AS target_type, r.place_id AS target_id
                FROM ratings r
                WHERE r.user_id = ANY(:user_ids) AND r.place_id IS NOT NULL
                UNION ALL
                SELECT r.user_id, 'event'::text, r.event_id
                FROM ratings r
                WHERE r.user_id = ANY(:user_ids) AND r.event_id IS NOT NULL
                UNION ALL
                SELECT rv.user_id, 'place'::text, rv.place_id
                FROM reviews rv
                WHERE rv.user_id = ANY(:user_ids) AND rv.place_id IS NOT NULL
                UNION ALL
                SELECT rv.user_id, 'event'::text, rv.event_id
                FROM reviews rv
                WHERE rv.user_id = ANY(:user_ids) AND rv.event_id IS NOT NULL
                UNION ALL
                SELECT w.user_id, 'place'::text, w.place_id
                FROM wishlist_items w
                WHERE w.user_id = ANY(:user_ids) AND w.place_id IS NOT NULL
                UNION ALL
                SELECT w.user_id, 'event'::text, w.event_id
                FROM wishlist_items w
                WHERE w.user_id = ANY(:user_ids) AND w.event_id IS NOT NULL
                UNION ALL
                SELECT b.user_id, 'place'::text, b.place_id
                FROM bookings b
                WHERE b.user_id = ANY(:user_ids) AND b.place_id IS NOT NULL
                UNION ALL
                SELECT b.user_id, 'event'::text, b.event_id
                FROM bookings b
                WHERE b.user_id = ANY(:user_ids) AND b.event_id IS NOT NULL
                UNION ALL
                SELECT c.user_id, 'place'::text, c.place_id
                FROM check_ins c
                WHERE c.user_id = ANY(:user_ids) AND c.place_id IS NOT NULL
                UNION ALL
                SELECT c.user_id, 'event'::text, c.event_id
                FROM check_ins c
                WHERE c.user_id = ANY(:user_ids) AND c.event_id IS NOT NULL
                UNION ALL
                SELECT a.user_id, 'place'::text, a.place_id
                FROM activity_logs a
                WHERE a.user_id = ANY(:user_ids) AND a.place_id IS NOT NULL
                UNION ALL
                SELECT a.user_id, 'event'::text, a.event_id
                FROM activity_logs a
                WHERE a.user_id = ANY(:user_ids) AND a.event_id IS NOT NULL
            )
            SELECT
                i.user_id,
                i.target_type,
                COALESCE(p.category, e.category) AS category,
                COUNT(*)::int AS interaction_count
            FROM interactions i
            LEFT JOIN places p ON i.target_type = 'place' AND p.id = i.target_id
            LEFT JOIN events e ON i.target_type = 'event' AND e.id = i.target_id
            WHERE COALESCE(p.category, e.category) IS NOT NULL
            GROUP BY i.user_id, i.target_type, COALESCE(p.category, e.category)
            """
        ).bindparams(bindparam("user_ids", type_=ARRAY(Integer)))

        users_df = pd.DataFrame(self.db.execute(users_sql, {"user_ids": user_ids}).mappings().all())
        pref_df = pd.DataFrame(self.db.execute(pref_sql, {"user_ids": user_ids}).mappings().all())

        if users_df.empty:
            users_df = pd.DataFrame(
                columns=[
                    "user_id",
                    "rating_count",
                    "avg_rating_given",
                    "review_count",
                    "wishlist_count",
                    "booking_count",
                    "search_count",
                    "avg_search_results",
                    "checkin_count",
                    "activity_count",
                ]
            )

        if pref_df.empty:
            pref_df = pd.DataFrame(columns=["user_id", "target_type", "category", "interaction_count"])

        return UserFeatureBundle(users_df=users_df, preference_df=pref_df)

    def build_training_pairs(
        self,
        user_ids: list[int],
        max_positive_per_user: int = 40,
        max_negative_per_user: int = 60,
    ) -> pd.DataFrame:
        if not user_ids:
            return pd.DataFrame()

        positives_sql = text(
            """
            WITH raw_interactions AS (
                SELECT r.user_id, 'place'::text AS target_type, r.place_id AS target_id, r.created_at AS ts
                FROM ratings r
                WHERE r.user_id = ANY(:user_ids) AND r.place_id IS NOT NULL
                UNION ALL
                SELECT r.user_id, 'event'::text, r.event_id, r.created_at
                FROM ratings r
                WHERE r.user_id = ANY(:user_ids) AND r.event_id IS NOT NULL
                UNION ALL
                SELECT rv.user_id, 'place'::text, rv.place_id, rv.created_at
                FROM reviews rv
                WHERE rv.user_id = ANY(:user_ids) AND rv.place_id IS NOT NULL
                UNION ALL
                SELECT rv.user_id, 'event'::text, rv.event_id, rv.created_at
                FROM reviews rv
                WHERE rv.user_id = ANY(:user_ids) AND rv.event_id IS NOT NULL
                UNION ALL
                SELECT w.user_id, 'place'::text, w.place_id, w.added_at
                FROM wishlist_items w
                WHERE w.user_id = ANY(:user_ids) AND w.place_id IS NOT NULL
                UNION ALL
                SELECT w.user_id, 'event'::text, w.event_id, w.added_at
                FROM wishlist_items w
                WHERE w.user_id = ANY(:user_ids) AND w.event_id IS NOT NULL
                UNION ALL
                SELECT b.user_id, 'place'::text, b.place_id, b.created_at
                FROM bookings b
                WHERE b.user_id = ANY(:user_ids) AND b.place_id IS NOT NULL
                UNION ALL
                SELECT b.user_id, 'event'::text, b.event_id, b.created_at
                FROM bookings b
                WHERE b.user_id = ANY(:user_ids) AND b.event_id IS NOT NULL
                UNION ALL
                SELECT c.user_id, 'place'::text, c.place_id, c.checked_in_at
                FROM check_ins c
                WHERE c.user_id = ANY(:user_ids) AND c.place_id IS NOT NULL
                UNION ALL
                SELECT c.user_id, 'event'::text, c.event_id, c.checked_in_at
                FROM check_ins c
                WHERE c.user_id = ANY(:user_ids) AND c.event_id IS NOT NULL
                UNION ALL
                SELECT a.user_id, 'place'::text, a.place_id, a.created_at
                FROM activity_logs a
                WHERE a.user_id = ANY(:user_ids) AND a.place_id IS NOT NULL
                UNION ALL
                SELECT a.user_id, 'event'::text, a.event_id, a.created_at
                FROM activity_logs a
                WHERE a.user_id = ANY(:user_ids) AND a.event_id IS NOT NULL
                UNION ALL
                SELECT s.user_id, s.clicked_entity_type::text, s.clicked_entity_id, s.searched_at
                FROM search_histories s
                WHERE s.user_id = ANY(:user_ids)
                  AND s.clicked_entity_type IN ('place', 'event')
                  AND s.clicked_entity_id IS NOT NULL
            ),
            dedup AS (
                SELECT DISTINCT user_id, target_type, target_id, ts
                FROM raw_interactions
            ),
            ranked AS (
                SELECT *,
                       row_number() OVER (
                           PARTITION BY user_id, target_type
                           ORDER BY ts DESC NULLS LAST
                       ) AS rn
                FROM dedup
            )
            SELECT user_id, target_type, target_id, 1 AS label
            FROM ranked
            WHERE rn <= :max_positive_per_user
            """
        ).bindparams(bindparam("user_ids", type_=ARRAY(Integer)))

        item_pool_sql = text(
            """
            WITH place_pop AS (
                SELECT place_id AS target_id, 'place'::text AS target_type, COUNT(*)::int AS pop
                FROM (
                    SELECT place_id FROM ratings WHERE place_id IS NOT NULL
                    UNION ALL SELECT place_id FROM reviews WHERE place_id IS NOT NULL
                    UNION ALL SELECT place_id FROM wishlist_items WHERE place_id IS NOT NULL
                    UNION ALL SELECT place_id FROM bookings WHERE place_id IS NOT NULL
                    UNION ALL SELECT place_id FROM check_ins WHERE place_id IS NOT NULL
                    UNION ALL SELECT place_id FROM activity_logs WHERE place_id IS NOT NULL
                ) x
                GROUP BY place_id
            ),
            event_pop AS (
                SELECT event_id AS target_id, 'event'::text AS target_type, COUNT(*)::int AS pop
                FROM (
                    SELECT event_id FROM ratings WHERE event_id IS NOT NULL
                    UNION ALL SELECT event_id FROM reviews WHERE event_id IS NOT NULL
                    UNION ALL SELECT event_id FROM wishlist_items WHERE event_id IS NOT NULL
                    UNION ALL SELECT event_id FROM bookings WHERE event_id IS NOT NULL
                    UNION ALL SELECT event_id FROM check_ins WHERE event_id IS NOT NULL
                    UNION ALL SELECT event_id FROM activity_logs WHERE event_id IS NOT NULL
                ) y
                GROUP BY event_id
            )
            SELECT target_type, target_id
            FROM (
                SELECT * FROM place_pop
                UNION ALL
                SELECT * FROM event_pop
            ) p
            ORDER BY pop DESC
            LIMIT 5000
            """
        )

        positives_df = pd.DataFrame(
            self.db.execute(
                positives_sql,
                {"user_ids": user_ids, "max_positive_per_user": max_positive_per_user},
            ).mappings().all()
        )

        if positives_df.empty:
            return pd.DataFrame()

        pool_df = pd.DataFrame(self.db.execute(item_pool_sql).mappings().all())
        if pool_df.empty:
            return positives_df

        pool_map: dict[str, np.ndarray] = {}
        for target_type in ["place", "event"]:
            ids = pool_df[pool_df["target_type"] == target_type]["target_id"].to_numpy()
            pool_map[target_type] = ids

        positive_set = set(
            zip(
                positives_df["user_id"].tolist(),
                positives_df["target_type"].tolist(),
                positives_df["target_id"].tolist(),
            )
        )

        rng = np.random.default_rng(42)
        negatives: list[dict[str, Any]] = []

        for user_id in user_ids:
            for target_type in ["place", "event"]:
                pool = pool_map.get(target_type, np.array([]))
                if pool.size == 0:
                    continue

                sampled = rng.choice(pool, size=min(max_negative_per_user, pool.size), replace=False)
                for target_id in sampled.tolist():
                    key = (user_id, target_type, int(target_id))
                    if key in positive_set:
                        continue
                    negatives.append(
                        {
                            "user_id": user_id,
                            "target_type": target_type,
                            "target_id": int(target_id),
                            "label": 0,
                        }
                    )

        neg_df = pd.DataFrame(negatives)
        if neg_df.empty:
            return positives_df

        return pd.concat([positives_df, neg_df], ignore_index=True)

    def build_item_features(self, target_ids: list[tuple[str, int]]) -> pd.DataFrame:
        if not target_ids:
            return pd.DataFrame(columns=["target_type", "target_id", "category", "popularity_all", "popularity_30d", "item_avg_rating"])

        place_ids = [target_id for t, target_id in target_ids if t == "place"]
        event_ids = [target_id for t, target_id in target_ids if t == "event"]

        place_stats_sql = text(
            """
            WITH pop_all AS (
                SELECT place_id AS target_id, COUNT(*)::int AS popularity_all
                FROM (
                    SELECT place_id FROM ratings WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id FROM reviews WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id FROM wishlist_items WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id FROM bookings WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id FROM check_ins WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id FROM activity_logs WHERE place_id = ANY(:place_ids)
                ) z
                GROUP BY place_id
            ),
            pop_30d AS (
                SELECT place_id AS target_id, COUNT(*)::int AS popularity_30d
                FROM (
                    SELECT place_id, created_at AS ts FROM ratings WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id, created_at FROM reviews WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id, added_at FROM wishlist_items WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id, created_at FROM bookings WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id, checked_in_at FROM check_ins WHERE place_id = ANY(:place_ids)
                    UNION ALL SELECT place_id, created_at FROM activity_logs WHERE place_id = ANY(:place_ids)
                ) r
                WHERE ts >= NOW() - INTERVAL '30 days'
                GROUP BY place_id
            ),
            r_avg AS (
                SELECT place_id AS target_id, AVG(score)::float AS item_avg_rating
                FROM ratings
                WHERE place_id = ANY(:place_ids)
                GROUP BY place_id
            )
            SELECT
                'place'::text AS target_type,
                p.id AS target_id,
                p.category,
                COALESCE(pa.popularity_all, 0) AS popularity_all,
                COALESCE(p30.popularity_30d, 0) AS popularity_30d,
                COALESCE(ra.item_avg_rating, p.average_rating::float, 0.0) AS item_avg_rating
            FROM places p
            LEFT JOIN pop_all pa ON pa.target_id = p.id
            LEFT JOIN pop_30d p30 ON p30.target_id = p.id
            LEFT JOIN r_avg ra ON ra.target_id = p.id
            WHERE p.id = ANY(:place_ids)
            """
        ).bindparams(bindparam("place_ids", type_=ARRAY(Integer)))

        event_stats_sql = text(
            """
            WITH pop_all AS (
                SELECT event_id AS target_id, COUNT(*)::int AS popularity_all
                FROM (
                    SELECT event_id FROM ratings WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id FROM reviews WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id FROM wishlist_items WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id FROM bookings WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id FROM check_ins WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id FROM activity_logs WHERE event_id = ANY(:event_ids)
                ) z
                GROUP BY event_id
            ),
            pop_30d AS (
                SELECT event_id AS target_id, COUNT(*)::int AS popularity_30d
                FROM (
                    SELECT event_id, created_at AS ts FROM ratings WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id, created_at FROM reviews WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id, added_at FROM wishlist_items WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id, created_at FROM bookings WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id, checked_in_at FROM check_ins WHERE event_id = ANY(:event_ids)
                    UNION ALL SELECT event_id, created_at FROM activity_logs WHERE event_id = ANY(:event_ids)
                ) r
                WHERE ts >= NOW() - INTERVAL '30 days'
                GROUP BY event_id
            ),
            r_avg AS (
                SELECT event_id AS target_id, AVG(score)::float AS item_avg_rating
                FROM ratings
                WHERE event_id = ANY(:event_ids)
                GROUP BY event_id
            )
            SELECT
                'event'::text AS target_type,
                e.id AS target_id,
                e.category,
                COALESCE(pa.popularity_all, 0) AS popularity_all,
                COALESCE(p30.popularity_30d, 0) AS popularity_30d,
                COALESCE(ra.item_avg_rating, e.average_rating::float, 0.0) AS item_avg_rating
            FROM events e
            LEFT JOIN pop_all pa ON pa.target_id = e.id
            LEFT JOIN pop_30d p30 ON p30.target_id = e.id
            LEFT JOIN r_avg ra ON ra.target_id = e.id
            WHERE e.id = ANY(:event_ids)
            """
        ).bindparams(bindparam("event_ids", type_=ARRAY(Integer)))

        parts: list[pd.DataFrame] = []
        if place_ids:
            parts.append(pd.DataFrame(self.db.execute(place_stats_sql, {"place_ids": place_ids}).mappings().all()))
        if event_ids:
            parts.append(pd.DataFrame(self.db.execute(event_stats_sql, {"event_ids": event_ids}).mappings().all()))

        if not parts:
            return pd.DataFrame(columns=["target_type", "target_id", "category", "popularity_all", "popularity_30d", "item_avg_rating"])

        return pd.concat(parts, ignore_index=True)

    def assemble_feature_frame(self, pairs_df: pd.DataFrame, user_bundle: UserFeatureBundle, item_df: pd.DataFrame) -> pd.DataFrame:
        if pairs_df.empty:
            return pd.DataFrame()

        df = pairs_df.merge(user_bundle.users_df, on="user_id", how="left")
        df = df.merge(item_df, on=["target_type", "target_id"], how="left")

        pref = user_bundle.preference_df.copy()
        if pref.empty:
            pref = pd.DataFrame(columns=["user_id", "target_type", "category", "interaction_count"])

        df = df.merge(
            pref.rename(columns={"interaction_count": "user_category_interest"}),
            on=["user_id", "target_type", "category"],
            how="left",
        )

        df["user_category_interest"] = df["user_category_interest"].fillna(0)
        df["category_match"] = (df["user_category_interest"] > 0).astype(int)
        df["is_event"] = (df["target_type"] == "event").astype(int)
        df["trend_ratio"] = (df["popularity_30d"].fillna(0) + 1.0) / (df["popularity_all"].fillna(0) + 1.0)

        numeric_cols = [
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

        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

        return df

    def build_prediction_candidates(self, user_id: int, target_type: str, candidate_limit: int = 200) -> pd.DataFrame:
        pref_sql = text(
            """
            WITH interactions AS (
                SELECT 'place'::text AS target_type, place_id AS target_id FROM ratings WHERE user_id = :user_id AND place_id IS NOT NULL
                UNION ALL SELECT 'event'::text, event_id FROM ratings WHERE user_id = :user_id AND event_id IS NOT NULL
                UNION ALL SELECT 'place'::text, place_id FROM reviews WHERE user_id = :user_id AND place_id IS NOT NULL
                UNION ALL SELECT 'event'::text, event_id FROM reviews WHERE user_id = :user_id AND event_id IS NOT NULL
                UNION ALL SELECT 'place'::text, place_id FROM wishlist_items WHERE user_id = :user_id AND place_id IS NOT NULL
                UNION ALL SELECT 'event'::text, event_id FROM wishlist_items WHERE user_id = :user_id AND event_id IS NOT NULL
                UNION ALL SELECT 'place'::text, place_id FROM bookings WHERE user_id = :user_id AND place_id IS NOT NULL
                UNION ALL SELECT 'event'::text, event_id FROM bookings WHERE user_id = :user_id AND event_id IS NOT NULL
                UNION ALL SELECT 'place'::text, place_id FROM check_ins WHERE user_id = :user_id AND place_id IS NOT NULL
                UNION ALL SELECT 'event'::text, event_id FROM check_ins WHERE user_id = :user_id AND event_id IS NOT NULL
                UNION ALL SELECT 'place'::text, place_id FROM activity_logs WHERE user_id = :user_id AND place_id IS NOT NULL
                UNION ALL SELECT 'event'::text, event_id FROM activity_logs WHERE user_id = :user_id AND event_id IS NOT NULL
            )
            SELECT i.target_type, COALESCE(p.category, e.category) AS category, COUNT(*)::int AS total
            FROM interactions i
            LEFT JOIN places p ON i.target_type = 'place' AND p.id = i.target_id
            LEFT JOIN events e ON i.target_type = 'event' AND e.id = i.target_id
            WHERE i.target_type = :target_type AND COALESCE(p.category, e.category) IS NOT NULL
            GROUP BY i.target_type, COALESCE(p.category, e.category)
            ORDER BY total DESC
            LIMIT 3
            """
        )

        pref_rows = self.db.execute(pref_sql, {"user_id": user_id, "target_type": target_type}).mappings().all()
        categories = [row["category"] for row in pref_rows]

        if target_type == "place":
            pool_sql = text(
                """
                WITH seen AS (
                    SELECT place_id AS target_id FROM ratings WHERE user_id = :user_id AND place_id IS NOT NULL
                    UNION SELECT place_id FROM reviews WHERE user_id = :user_id AND place_id IS NOT NULL
                    UNION SELECT place_id FROM wishlist_items WHERE user_id = :user_id AND place_id IS NOT NULL
                    UNION SELECT place_id FROM bookings WHERE user_id = :user_id AND place_id IS NOT NULL
                    UNION SELECT place_id FROM check_ins WHERE user_id = :user_id AND place_id IS NOT NULL
                    UNION SELECT place_id FROM activity_logs WHERE user_id = :user_id AND place_id IS NOT NULL
                )
                SELECT p.id AS target_id, 'place'::text AS target_type
                FROM places p
                LEFT JOIN seen s ON s.target_id = p.id
                WHERE p.is_published = true
                  AND s.target_id IS NULL
                  AND (
                    :has_categories = false OR p.category = ANY(:categories)
                  )
                ORDER BY p.average_rating DESC, p.total_reviews DESC, p.id DESC
                LIMIT :candidate_limit
                """
            ).bindparams(bindparam("categories", type_=ARRAY(Text)))
        else:
            pool_sql = text(
                """
                WITH seen AS (
                    SELECT event_id AS target_id FROM ratings WHERE user_id = :user_id AND event_id IS NOT NULL
                    UNION SELECT event_id FROM reviews WHERE user_id = :user_id AND event_id IS NOT NULL
                    UNION SELECT event_id FROM wishlist_items WHERE user_id = :user_id AND event_id IS NOT NULL
                    UNION SELECT event_id FROM bookings WHERE user_id = :user_id AND event_id IS NOT NULL
                    UNION SELECT event_id FROM check_ins WHERE user_id = :user_id AND event_id IS NOT NULL
                    UNION SELECT event_id FROM activity_logs WHERE user_id = :user_id AND event_id IS NOT NULL
                )
                SELECT e.id AS target_id, 'event'::text AS target_type
                FROM events e
                LEFT JOIN seen s ON s.target_id = e.id
                WHERE e.is_published = true
                  AND s.target_id IS NULL
                  AND (
                    :has_categories = false OR e.category = ANY(:categories)
                  )
                ORDER BY e.average_rating DESC, e.total_reviews DESC, e.id DESC
                LIMIT :candidate_limit
                """
            ).bindparams(bindparam("categories", type_=ARRAY(Text)))

        rows = self.db.execute(
            pool_sql,
            {
                "user_id": user_id,
                "candidate_limit": candidate_limit,
                "categories": categories if categories else ["__none__"],
                "has_categories": len(categories) > 0,
            },
        ).mappings().all()

        return pd.DataFrame(rows)
