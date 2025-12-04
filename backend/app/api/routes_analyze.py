# backend/app/api/routes_analyze.py
# api routes for disclosure analysis (transparency scoring endpoints)
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Literal

from app.services.scoring_service import score_disclosure

router = APIRouter()

class AnalyzeRequest(BaseModel):
    # input text to analyze
    text: str
    # optional claimed impact value (tons CO2)
    claimed_impact_co2_tons: Optional[float] = None
    # scoring mode: rule | ml | blend
    mode: Literal["rule", "ml", "blend"] = Field(
        "rule", description="Transparency scoring mode"
    )

@router.post("/analyze_text")
def analyze_text(req: AnalyzeRequest):
    # endpoint: score a free-text disclosure and return structured result
    result = score_disclosure(
        text=req.text,
        claimed_impact_co2_tons=req.claimed_impact_co2_tons,
        mode=req.mode,
    )
    return result
