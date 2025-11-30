from fastapi import APIRouter, HTTPException
from app.services.market_data_csv import get_price_series, get_series_summary

router = APIRouter()


@router.get("/market/{symbol}")
def get_market_prices(symbol: str, days: int = 365):
    """
    Return price series for a symbol from market_series.csv,
    in lightweight-charts format.
    """
    series = get_price_series(symbol, days=days)
    if not series:
        raise HTTPException(
            status_code=404,
            detail=f"No market data found for symbol '{symbol}'",
        )
    return series


@router.get("/market/series/{symbol}")
def get_market_series_summary(symbol: str, days: int = 365):
    """
    Return a small summary including latest price and yields.
    """
    summary = get_series_summary(symbol, days=days)
    if summary["latest"] is None:
        raise HTTPException(
            status_code=404,
            detail=f"No market data found for symbol '{symbol}'",
        )
    return summary
