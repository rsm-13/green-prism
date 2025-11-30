#!/usr/bin/env python
"""
Build a unified market_series.csv from green bond index / ETF time series.

Usage (example):

cd green-prism/backend
    python app/scripts/build_market_series.py \
        --sp-index app/data/Green_Bond_Data.csv \
        --ishares app/data/iShares_Green_Bond_Index_Fund_IE.csv \
        --output app/data/market_series.csv

The output schema is:

    symbol, date, price, yield_to_maturity, yield_to_worst, nav
"""

import argparse
from pathlib import Path
from typing import List, Optional

import numpy as np
import pandas as pd


COMMON_COLS = [
    "symbol",
    "date",
    "price",
    "yield_to_maturity",
    "yield_to_worst",
    "nav",
]


# ------------------------------
# HELPERS
# ------------------------------

def parse_percent(s: str) -> Optional[float]:
    """
    Convert strings like '2.29%' -> 2.29 (float).
    Returns None if parsing fails.
    """
    if pd.isna(s):
        return None
    try:
        s_str = str(s).strip().replace("%", "")
        if s_str == "":
            return None
        return float(s_str)
    except Exception:
        return None


# ------------------------------
# S&P GREEN BOND INDEX (Kaggle: "Green Bond Data.csv")
# ------------------------------

def normalize_sp_index(path: Path) -> pd.DataFrame:
    """
    Normalize 'Green Bond Data.csv' to the common schema.

    Expected columns:
        'Effective date '
        'S&P Green Bond Index'
        'Yield To Maturity'
        'Yield To Worst'
    """
    df = pd.read_csv(path)

    cols = set(df.columns)
    required = {
        "Effective date ",
        "S&P Green Bond Index",
        "Yield To Maturity",
        "Yield To Worst",
    }
    if not required.issubset(cols):
        print(
            f"[normalize_sp_index] File {path} does not have expected columns "
            f"(got {df.columns.tolist()}) – skipping."
        )
        return pd.DataFrame(columns=COMMON_COLS)

    # Create output frame with the same index as the source so scalar
    # assignments (like a constant `symbol`) broadcast to the full length.
    out = pd.DataFrame(index=df.index)

    # Symbol (broadcasted)
    out["symbol"] = "SP_GB_INDEX"

    # Dates
    out["date"] = pd.to_datetime(df["Effective date "], errors="coerce").dt.date

    # Price (index level)
    out["price"] = pd.to_numeric(
        df["S&P Green Bond Index"], errors="coerce"
    )

    # Yields in percent units
    out["yield_to_maturity"] = df["Yield To Maturity"].apply(parse_percent)
    out["yield_to_worst"] = df["Yield To Worst"].apply(parse_percent)

    # No NAV concept for an index
    out["nav"] = np.nan

    # Ensure all common columns exist
    for col in COMMON_COLS:
        if col not in out.columns:
            out[col] = np.nan

    return out[COMMON_COLS]


# ------------------------------
# ISHARES GREEN BOND INDEX FUND (IE)
# ------------------------------

def normalize_ishares(path: Path) -> pd.DataFrame:
    """
    Normalize 'iShares Green Bond Index Fund (IE).csv' to the common schema.

    Expected columns:
        'As Of'
        'NAV'
        'Daily NAV Change'
        'Daily NAV Change %'
    """
    df = pd.read_csv(path)

    cols = set(df.columns)
    required = {"As Of", "NAV"}
    if not required.issubset(cols):
        print(
            f"[normalize_ishares] File {path} does not have expected columns "
            f"(got {df.columns.tolist()}) – skipping."
        )
        return pd.DataFrame(columns=COMMON_COLS)

    # Create output frame with the same index as the source so scalar
    # assignments (like a constant `symbol`) broadcast to the full length.
    out = pd.DataFrame(index=df.index)

    out["symbol"] = "ISHARES_GB_INDEX_IE"

    # Date
    out["date"] = pd.to_datetime(df["As Of"], errors="coerce").dt.date

    # For simplicity: price = NAV
    out["price"] = pd.to_numeric(df["NAV"], errors="coerce")
    out["nav"] = out["price"]

    # This dataset does not include yields; could be approximated later
    out["yield_to_maturity"] = np.nan
    out["yield_to_worst"] = np.nan

    for col in COMMON_COLS:
        if col not in out.columns:
            out[col] = np.nan

    return out[COMMON_COLS]


# ------------------------------
# MAIN
# ------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Build unified market_series.csv from green bond index / ETF time series."
    )
    parser.add_argument(
        "--sp-index",
        type=Path,
        help="Path to 'Green Bond Data.csv' (S&P Green Bond Index).",
    )
    parser.add_argument(
        "--ishares",
        type=Path,
        help="Path to 'iShares Green Bond Index Fund (IE).csv'.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output CSV path for the unified market series.",
    )

    args = parser.parse_args()

    frames: List[pd.DataFrame] = []

    if args.sp_index and args.sp_index.exists():
        print(f"Loading S&P Green Bond Index from {args.sp_index}")
        frames.append(normalize_sp_index(args.sp_index))
    else:
        print("[build_market_series] No --sp-index provided or file missing.")

    if args.ishares and args.ishares.exists():
        print(f"Loading iShares Green Bond Index Fund (IE) from {args.ishares}")
        frames.append(normalize_ishares(args.ishares))
    else:
        print("[build_market_series] No --ishares provided or file missing.")

    if not frames:
        raise SystemExit(
            "No input datasets found. Provide at least one of --sp-index / --ishares."
        )

    combined = pd.concat(frames, ignore_index=True)

    # Remove rows missing date or price/nav (completely unusable)
    combined = combined.dropna(subset=["date"])

    combined = combined.sort_values(["symbol", "date"]).reset_index(drop=True)

    # Ensure all common columns present and order them
    for col in COMMON_COLS:
        if col not in combined.columns:
            combined[col] = np.nan
    combined = combined[COMMON_COLS]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(args.output, index=False)
    print(f"Wrote unified market series with {len(combined)} rows to {args.output}")


if __name__ == "__main__":
    main()
