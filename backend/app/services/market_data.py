import datetime
import requests
import time
from typing import List, Dict

STOOQ_URL = "https://stooq.com/q/d/l/?s=grnb.us&i=d"

def fetch_grnb_history(days: int = 365) -> List[Dict]:
    """Fetch historical GRNB ETF prices from stooq.com"""
    response = requests.get(STOOQ_URL)
    if response.status_code != 200:
        print("Stooq request failed:", response.status_code)
        return []

    lines = response.text.splitlines()
    if len(lines) < 2:
        print("Stooq returned empty or malformed CSV.")
        return []

    data = []
    header_skipped = False

    now = int(time.time())
    cutoff = now - days * 86400

    for row in lines:
        if not header_skipped:
            header_skipped = True
            continue

        parts = row.split(",")
        if len(parts) < 5:
            continue

        date_str, _, _, _, close_price, *_ = parts

        if close_price in ("", "null"):
            continue

        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        unix = int(time.mktime(dt.timetuple()))

        if unix < cutoff:
            continue

        try:
            value = float(close_price)
            data.append({"time": unix, "value": value})
        except ValueError:
            continue

    return data
