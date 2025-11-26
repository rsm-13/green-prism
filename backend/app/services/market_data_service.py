"""
Market data / price proxy service.
Later: call real ETF or bond price APIs.
"""

from datetime import date, timedelta
from typing import List, Dict


def get_etf_price_history(ticker: str = "GRNB", days: int = 30) -> List[Dict]:
    """
    Placeholder that returns a simple synthetic price series.
    """
    today = date.today()
    base_price = 50.0
    data: List[Dict] = []
    for i in range(days):
        d = today - timedelta(days=(days - 1 - i))
        price = base_price + 0.05 * i
        data.append({"date": d.isoformat(), "close": round(price, 2)})
    return data
