from fastapi import APIRouter
from app.services.market_data import fetch_etf_history

router = APIRouter()


@router.get("/market/{symbol}")
def get_etf_prices(symbol: str, days: int = 365):
    """
    Return historical prices for an ETF symbol (e.g. 'grnb', 'bgrn')
    over the last `days` days.
    """
    return fetch_etf_history(symbol, days=days)
