# backend/app/api/routes_analyze.py
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Literal

from app.services.scoring_service import score_disclosure

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    claimed_impact_co2_tons: Optional[float] = None
    mode: Literal["rule", "ml", "blend"] = Field(
        "rule", description="Transparency scoring mode"
    )

@router.post("/analyze_text")
def analyze_text(req: AnalyzeRequest):
    result = score_disclosure(
        text=req.text,
        claimed_impact_co2_tons=req.claimed_impact_co2_tons,
        mode=req.mode,
    )
    return result
