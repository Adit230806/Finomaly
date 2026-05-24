from fastapi import APIRouter, Depends

from app.api.dependencies import verify_api_key
from app.schemas.request import PredictRequest
from app.schemas.response import PredictResponse
from app.services.prediction_service import predict_transaction

router = APIRouter(prefix="/api/v1", tags=["predict"])


@router.post(
    "/predict",
    response_model=PredictResponse,
    response_model_by_alias=True,
    dependencies=[Depends(verify_api_key)],
)
async def predict(body: PredictRequest) -> PredictResponse:
    """
    Score a transaction with hybrid rule + Isolation Forest engine.

    Trusted history must exclude anomalies (risk_score < 30 only).
    """
    return predict_transaction(body)
