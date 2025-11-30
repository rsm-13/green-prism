from functools import lru_cache
from pathlib import Path
from typing import List, Dict, Optional

import pandas as pd
import numpy as np

DATA_PATH = Path(__file__).resolve().parents[2] / "app" / "data" / "market_series.csv"


@lru_cache(maxsize=1)
def _load_market_df() -> pd.DataFrame:
    """
    Load market_series.csv once and cache it in memory.
    Expected columns:
        symbol, date, price, yield_to_maturity, yield_to_worst, nav
    """
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Market data file not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return df


def get_price_series(symbol: str, days: Optional[int] = None) -> List[Dict]:
    """
    Return price series for a given symbol in lightweight-charts format:
        [{ time: unix_timestamp, value: price }, ...]
    Uses 'price' if available, otherwise 'nav'.
    """
    df = _load_market_df()
    df = df[df["symbol"] == symbol].copy()
    df = df.sort_values("date")

    if df.empty:
        return []

    if days is not None:
        max_date = df["date"].max()
        cutoff = max_date - pd.Timedelta(days=days)
        df = df[df["date"] >= cutoff]

    records: List[Dict] = []
    for _, row in df.iterrows():
        date = row["date"]
        if pd.isna(date):
            continue

        price = row.get("price", np.nan)
        if pd.isna(price):
            price = row.get("nav", np.nan)
        if pd.isna(price):
            continue

        ts = int(date.timestamp())
        records.append({"time": ts, "value": float(price)})

    return records


def get_series_summary(symbol: str, days: Optional[int] = None) -> Dict:
    """
    Return a small summary with the latest price and yields:

    {
        "symbol": "...",
        "days": 365,
        "latest": {
            "date": "2025-01-10",
            "price": 123.45,
            "yield_to_maturity": 2.34,
            "yield_to_worst": 2.11
        }
    }
    """
    df = _load_market_df()
    df = df[df["symbol"] == symbol].copy()
    df = df.sort_values("date")

    if df.empty:
        return {"symbol": symbol, "days": days, "latest": None}

    if days is not None:
        max_date = df["date"].max()
        cutoff = max_date - pd.Timedelta(days=days)
        df = df[df["date"] >= cutoff]

    if df.empty:
        return {"symbol": symbol, "days": days, "latest": None}

    latest = df.iloc[-1]

    # price or nav
    price = latest.get("price", np.nan)
    if pd.isna(price):
        price = latest.get("nav", np.nan)

    latest_dict = {
        "date": latest["date"].date().isoformat()
        if not pd.isna(latest["date"])
        else None,
        "price": float(price) if not pd.isna(price) else None,
        "yield_to_maturity": None,
        "yield_to_worst": None,
    }

    for col in ["yield_to_maturity", "yield_to_worst"]:
        if col in latest and not pd.isna(latest[col]):
            latest_dict[col] = float(latest[col])

    return {
        "symbol": symbol,
        "days": days,
        "latest": latest_dict,
    }
