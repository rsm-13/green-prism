from fastapi import APIRouter
from app.services.market_data import fetch_grnb_history

router = APIRouter()

@router.get("/market/grnb")
def get_grnb_prices(days: int = 365):
    return fetch_grnb_history(days)
