"""
Routes for text-based analysis:
POST /api/analyze_text
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from app.services.scoring_service import score_disclosure

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Issuer disclosure text")
    claimed_impact_co2_tons: Optional[float] = Field(
        None, description="Claimed CO₂ avoided (tons)"
    )


class AnalyzeResponse(BaseModel):
    transparency_score: float
    components: Dict[str, float]
    impact_prediction: Dict[str, Any]
    greenwashing_risk: str
    explanations: List[str]


@router.post("/analyze_text", response_model=AnalyzeResponse)
def analyze_text(payload: AnalyzeRequest) -> AnalyzeResponse:
    result = score_disclosure(
        payload.text, claimed_impact_co2_tons=payload.claimed_impact_co2_tons
    )
    return AnalyzeResponse(**result)
