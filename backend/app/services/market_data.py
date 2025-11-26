import datetime
import time
from typing import List, Dict

import requests

BASE_URL = "https://stooq.com/q/d/l/"


def fetch_etf_history(symbol: str, days: int = 365) -> List[Dict]:
    """
    Fetch daily OHLC data for an ETF from Stooq and return
    lightweight-charts compatible [{time, value}] list.
    `symbol` like "grnb" or "bgrn".
    """
    stooq_symbol = f"{symbol.lower()}.us"
    params = {
        "s": stooq_symbol,
        "i": "d",
    }

    resp = requests.get(BASE_URL, params=params)
    if resp.status_code != 200:
        print("Stooq request failed:", resp.status_code, resp.text[:200])
        return []

    lines = resp.text.splitlines()
    if len(lines) < 2:
        print("Stooq CSV is empty or malformed")
        return []

    now = int(time.time())
    cutoff = now - days * 86400

    data: List[Dict] = []
    header_skipped = False

    for row in lines:
        if not header_skipped:
            header_skipped = True
            continue

        parts = row.split(",")
        if len(parts) < 5:
            continue

        date_str, _open, _high, _low, close_price, *_ = parts

        if close_price in ("", "null"):
            continue

        try:
            dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
            unix = int(time.mktime(dt.timetuple()))
        except ValueError:
            continue

        if unix < cutoff:
            continue

        try:
            close = float(close_price)
        except ValueError:
            continue

        data.append({"time": unix, "value": close})

    return data
