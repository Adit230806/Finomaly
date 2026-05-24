from fastapi import APIRouter

from app.ml.model_store import get_model
from app.schemas.response import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    model = get_model()
    return HealthResponse(status="ok", model_loaded=model.is_loaded)
