from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)


class ChatbotService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.recommendation_service = RecommendationService(db)

    def ask(self, user_id: int | None, message: str, conversation_id: int | None = None) -> dict[str, Any]:
        resolved_user_id = user_id if user_id and user_id > 0 else None
        user = self._get_user(resolved_user_id) if resolved_user_id else {
            "id": None,
            "display_name": "Guest",
            "location": None,
        }

        conv_id = conversation_id or self._start_conversation(resolved_user_id)
        self._save_message(conv_id, resolved_user_id, "user", message)

        contextual_data = self._build_context(user_id=resolved_user_id, prompt=message)
        ai_reply = self._generate_gemini_reply(user=user, prompt=message, context=contextual_data)

        self._save_message(conv_id, resolved_user_id, "assistant", ai_reply, metadata={"model": settings.gemini_model})
        self._touch_conversation(conv_id)

        return {
            "conversation_id": conv_id,
            "message": ai_reply,
            "context": {
                "recommendation_count": len(contextual_data.get("recommendations", [])),
                "place_matches": len(contextual_data.get("places", [])),
                "event_matches": len(contextual_data.get("events", [])),
            },
        }

    def history(self, conversation_id: int, limit: int = 30) -> list[dict[str, Any]]:
        sql = text(
            """
            SELECT id, conversation_id, user_id, sender_role, message_type, body, metadata, created_at
            FROM messages
            WHERE conversation_id = :conversation_id
            ORDER BY created_at DESC
            LIMIT :limit
            """
        )
        rows = self.db.execute(sql, {"conversation_id": conversation_id, "limit": max(1, min(limit, 100))}).mappings().all()
        return [dict(row) for row in reversed(rows)]

    def _get_user(self, user_id: int | None) -> dict[str, Any] | None:
        if not user_id:
            return None
        sql = text("SELECT id, display_name, location FROM users WHERE id = :user_id LIMIT 1")
        row = self.db.execute(sql, {"user_id": user_id}).mappings().first()
        return dict(row) if row else None

    def _start_conversation(self, user_id: int | None) -> int:
        sql = text(
            """
            INSERT INTO conversations (user_id, channel, status, topic, started_at, last_message_at, created_at, updated_at)
            VALUES (:user_id, 'assistant', 'active', 'recommendation_assistant', NOW(), NOW(), NOW(), NOW())
            RETURNING id
            """
        )
        conv_id = self.db.execute(sql, {"user_id": user_id}).scalar_one()
        self.db.commit()
        return int(conv_id)

    def _touch_conversation(self, conversation_id: int) -> None:
        sql = text("UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = :conversation_id")
        self.db.execute(sql, {"conversation_id": conversation_id})
        self.db.commit()

    def _save_message(
        self,
        conversation_id: int,
        user_id: int | None,
        sender_role: str,
        body: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        sql = text(
            """
            INSERT INTO messages (conversation_id, user_id, sender_role, message_type, body, metadata, created_at)
            VALUES (:conversation_id, :user_id, :sender_role, 'text', :body, CAST(:metadata AS jsonb), NOW())
            """
        )
        metadata_str = "{}" if metadata is None else json.dumps(metadata)
        self.db.execute(
            sql,
            {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "sender_role": sender_role,
                "body": body,
                "metadata": metadata_str,
            },
        )
        self.db.commit()

    def _build_context(self, user_id: int | None, prompt: str) -> dict[str, Any]:
        if user_id:
            recommendations_raw = self.recommendation_service.recommend(user_id=user_id, limit=8)
        else:
            recommendations_raw = {"places": [], "events": []}
        rec_items: list[dict[str, Any]] = []
        for row in recommendations_raw.get("places", []):
            rec_items.append({"target_type": "place", "target_id": row.get("target_id"), "score": row.get("score"), "category": row.get("category")})
        for row in recommendations_raw.get("events", []):
            rec_items.append({"target_type": "event", "target_id": row.get("target_id"), "score": row.get("score"), "category": row.get("category")})

        lower_prompt = prompt.lower()
        wants_events = any(x in lower_prompt for x in ["event", "music", "concert", "weekend", "show"])
        wants_places = any(x in lower_prompt for x in ["cafe", "restaurant", "place", "rooftop", "hangout"])
        if not wants_events and not wants_places:
            wants_events = True
            wants_places = True

        places = self._query_places(prompt, limit=6) if wants_places else []
        events = self._query_events(prompt, limit=6) if wants_events else []

        return {
            "recommendations": rec_items,
            "places": places,
            "events": events,
        }

    def _query_places(self, prompt: str, limit: int) -> list[dict[str, Any]]:
        q = f"%{prompt.lower()}%"
        sql = text(
            """
            SELECT id, name, category, area_name, average_rating, total_reviews, budget_label
            FROM places
            WHERE is_published = true
              AND (
                    LOWER(name) LIKE :q
                 OR LOWER(category) LIKE :q
                 OR LOWER(COALESCE(description, '')) LIKE :q
              )
            ORDER BY average_rating DESC, total_reviews DESC
            LIMIT :limit
            """
        )
        rows = self.db.execute(sql, {"q": q, "limit": max(1, min(limit, 20))}).mappings().all()

        if rows:
            return [dict(r) for r in rows]

        broad_sql = text(
            """
            SELECT id, name, category, area_name, average_rating, total_reviews, budget_label
            FROM places
            WHERE is_published = true
            ORDER BY average_rating DESC, total_reviews DESC
            LIMIT :limit
            """
        )
        broad_rows = self.db.execute(broad_sql, {"limit": max(1, min(limit, 20))}).mappings().all()
        return [dict(r) for r in broad_rows]

    def _query_events(self, prompt: str, limit: int) -> list[dict[str, Any]]:
        query = prompt.lower()
        weekend_clause = ""
        if "weekend" in query:
            weekend_clause = "AND EXTRACT(DOW FROM event_date) IN (0, 6)"

        sql = text(
            f"""
            SELECT id, title, category, area_name, event_date, average_rating, total_reviews
            FROM events
            WHERE is_published = true
              {weekend_clause}
              AND (
                    LOWER(title) LIKE :q
                 OR LOWER(category) LIKE :q
                 OR LOWER(COALESCE(description, '')) LIKE :q
              )
            ORDER BY event_date ASC, average_rating DESC
            LIMIT :limit
            """
        )
        rows = self.db.execute(sql, {"q": f"%{query}%", "limit": max(1, min(limit, 20))}).mappings().all()

        if rows:
            return [dict(r) for r in rows]

        broad_sql = text(
            """
            SELECT id, title, category, area_name, event_date, average_rating, total_reviews
            FROM events
            WHERE is_published = true
            ORDER BY event_date ASC, average_rating DESC
            LIMIT :limit
            """
        )
        broad_rows = self.db.execute(broad_sql, {"limit": max(1, min(limit, 20))}).mappings().all()
        return [dict(r) for r in broad_rows]

    def _generate_gemini_reply(self, user: dict[str, Any], prompt: str, context: dict[str, Any]) -> str:
        if not settings.gemini_api_key:
            logger.error("GEMINI_API_KEY missing")
            return "Gemini API key is not configured. Please set GEMINI_API_KEY."

        system_instruction = (
            "You are VibeSpot Assistant. Use only provided context. "
            "Never invent places/events not in context. "
            "If data is insufficient, say so clearly and ask a follow-up. "
            "Explain why recommendations fit the user based on interactions/recommendation scores. "
            "If exact keyword matches are missing, still recommend the best available options from context places/events."
        )

        payload = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                f"User: {user}\\n"
                                f"User question: {prompt}\\n"
                                f"Context recommendations: {context.get('recommendations', [])}\\n"
                                f"Context places: {context.get('places', [])}\\n"
                                f"Context events: {context.get('events', [])}\\n"
                                "Return concise, helpful markdown bullet points when listing options."
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 500},
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"

        try:
            with httpx.Client(timeout=settings.gemini_timeout_seconds) as client:
                response = client.post(url, params={"key": settings.gemini_api_key}, json=payload)
                response.raise_for_status()
                data = response.json()

            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning("Gemini returned no candidates")
                return "I could not generate a response right now. Please try again."

            parts = candidates[0].get("content", {}).get("parts", [])
            text_parts = [part.get("text", "") for part in parts if part.get("text")]
            reply = "\n".join(text_parts).strip()
            if not reply:
                return "I could not generate a response right now. Please try again."

            lower_reply = reply.lower()
            if (
                ("don't have" in lower_reply or "couldn't find" in lower_reply or "cannot find" in lower_reply)
                and (context.get("places") or context.get("events"))
            ):
                return self._generate_context_fallback_reply(prompt=prompt, context=context)

            return reply
        except Exception as exc:
            logger.exception("Gemini call failed", exc_info=exc)
            return self._generate_context_fallback_reply(prompt=prompt, context=context)

    def _generate_context_fallback_reply(self, prompt: str, context: dict[str, Any]) -> str:
        places = context.get("places", [])[:3]
        events = context.get("events", [])[:3]
        recs = context.get("recommendations", [])[:4]

        lines: list[str] = []
        lines.append("I could not reach Gemini right now, but I can still help using live VibeSpot data.")

        if places:
            lines.append("")
            lines.append("Top place suggestions:")
            for place in places:
                lines.append(
                    f"- {place.get('name')} ({place.get('category')}, {place.get('area_name')}) "
                    f"- rating {place.get('average_rating')} from {place.get('total_reviews')} reviews"
                )

        if events:
            lines.append("")
            lines.append("Top event suggestions:")
            for event in events:
                lines.append(
                    f"- {event.get('title')} ({event.get('category')}, {event.get('area_name')}) "
                    f"on {event.get('event_date')}"
                )

        if recs:
            lines.append("")
            lines.append("Personalized signals from your recommendation profile:")
            for rec in recs:
                lines.append(
                    f"- {rec.get('target_type')} #{rec.get('target_id')} "
                    f"(score {round(float(rec.get('score') or 0), 3)})"
                )

        if len(lines) == 1:
            lines.append("")
            lines.append("Please refine your request (for example: 'best rooftop cafe in Gulshan').")

        return "\n".join(lines)
