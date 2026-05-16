from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.db_connection import get_db
from services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class AskRequest(BaseModel):
    user_id: int | None = Field(default=None, gt=0)
    message: str = Field(..., min_length=2, max_length=2000)
    conversation_id: int | None = Field(default=None, gt=0)


@router.post("/ask")
def ask_chatbot(payload: AskRequest, db: Session = Depends(get_db)):
    service = ChatbotService(db)

    try:
        result = service.ask(
            user_id=payload.user_id,
            message=payload.message,
            conversation_id=payload.conversation_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {"status": "success", "data": result}


@router.get("/conversations/{conversation_id}/messages")
def conversation_history(conversation_id: int, limit: int = 30, db: Session = Depends(get_db)):
    service = ChatbotService(db)
    rows = service.history(conversation_id=conversation_id, limit=limit)
    return {"status": "success", "data": rows, "meta": {"count": len(rows), "limit": limit}}
