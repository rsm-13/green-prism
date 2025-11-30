#!/usr/bin/env python
"""
Build a unified bonds.csv from multiple green bond datasets.

Usage (run in backend dir):

cd green-prism/backend

    python app/scripts/build_bonds_unified.py \
        --world-bank app/data/green_bonds_since_2008_11-28-2025.csv \
        --kapsarc app/data/green-bond-issuances.csv \
        --cbi app/data/bonds_export.csv \
        --kaggle app/data/Global_Sustainable_Bonds_Data.csv \
        --output app/data/bonds.csv


You can run it with any subset of the inputs; only provided files will be used.
"""

import argparse
import math
from pathlib import Path
from typing import Optional, List

import pandas as pd
import numpy as np


COMMON_COLS = [
    "bond_id",
    "source_dataset",
    "isin",
    "issuer_name",
    "issuer_type",
    "country",
    "currency",
    "amount_issued",
    "amount_issued_usd",
    "issue_date",
    "issue_year",
    "maturity_date",
    "maturity_year",
    "use_of_proceeds",
    "external_review_type",
    "certification",
    "claimed_impact_co2_tons",
    "actual_impact_co2_tons",
    "impact_source",
]


def safe_parse_date(val: str) -> Optional[pd.Timestamp]:
    if pd.isna(val):
        return None
    try:
        return pd.to_datetime(val)
    except Exception:
        return None


# ------------------------------
# WORLD BANK GREEN BONDS
# ------------------------------

def normalize_world_bank(path: Path) -> pd.DataFrame:
    """
    Normalize World Bank 'Green Bonds since 2008' CSV to common schema.
    Expected columns:
      type, maturity, denominated_currency, volume, coupon,
      settlement_date, maturity_date, usd_equivalent, isin,
      final_terms, institution
    """
    df = pd.read_csv(path)

    # base frame
    out = pd.DataFrame()
    out["source_dataset"] = "world_bank"
    out["isin"] = df.get("isin")
    out["issuer_name"] = df.get("institution", "World Bank")
    out["issuer_type"] = "Multilateral Dev Bank"
    out["country"] = "World"

    out["currency"] = df.get("denominated_currency")
    out["amount_issued"] = df.get("volume")
    out["amount_issued_usd"] = df.get("usd_equivalent")

    # dates
    settle = df.get("settlement_date")
    maturity = df.get("maturity_date")
    out["issue_date"] = pd.to_datetime(settle, errors="coerce")
    out["maturity_date"] = pd.to_datetime(maturity, errors="coerce")
    out["issue_year"] = out["issue_date"].dt.year
    out["maturity_year"] = out["maturity_date"].dt.year

    # use_of_proceeds: we only know it's "Green", but that's fine for now
    out["use_of_proceeds"] = df.get("type", "Green")

    out["external_review_type"] = None  # not explicit in this dataset
    out["certification"] = "World Bank Green Bond"

    out["claimed_impact_co2_tons"] = np.nan
    out["actual_impact_co2_tons"] = np.nan
    out["impact_source"] = None

    # bond_id: prefer ISIN if available
    def mk_id(row):
        isin = str(row.get("isin", "")).strip()
        if isin and isin != "nan":
            return f"WB-{isin}"
        # fallback: use index
        return f"WB-{row.name}"

    out["bond_id"] = out.apply(mk_id, axis=1)

    # reorder / ensure all columns exist
    for col in COMMON_COLS:
        if col not in out.columns:
            out[col] = np.nan

    return out[COMMON_COLS]


# ------------------------------
# KAPSARC GREEN BOND ISSUANCES
# ------------------------------

def normalize_kapsarc(path: Path) -> pd.DataFrame:
    """
    Normalize KAPSARC 'green-bond-issuances.csv' to common schema.
    Expected columns (semicolon separated):
      Year, Country, Indicator, Bond_Type, Type_of_Issuer,
      Use_of_Proceed, Principal_Currency, Unit, Value

    NOTE: This dataset is *issuance aggregates*, not single bonds.
    We'll treat each row as a 'synthetic bond bucket' for now.
    """
    df = pd.read_csv(path, sep=";")

    out = pd.DataFrame()
    out["source_dataset"] = "kapsarc"
    out["isin"] = None  # not provided

    out["issuer_name"] = df["Country"]
    out["issuer_type"] = df["Type_of_Issuer"]
    out["country"] = df["Country"]

    out["currency"] = df["Principal_Currency"]

    # Value is e.g. 'Billion US Dollars'
    unit = df["Unit"].fillna("")
    value = df["Value"]
    amount_usd = []
    for u, v in zip(unit, value):
        if pd.isna(v):
            amount_usd.append(np.nan)
            continue
        if "Billion" in u:
            amount_usd.append(float(v) * 1e9)
        elif "Million" in u:
            amount_usd.append(float(v) * 1e6)
        else:
            amount_usd.append(float(v))
    out["amount_issued_usd"] = amount_usd

    out["amount_issued"] = out["amount_issued_usd"]  # no local amount, but ok

    out["issue_year"] = df["Year"]
    out["issue_date"] = pd.to_datetime(df["Year"].astype(str) + "-01-01",
                                       errors="coerce")

    out["maturity_date"] = pd.NaT
    out["maturity_year"] = np.nan

    out["use_of_proceeds"] = df["Use_of_Proceed"]

    out["external_review_type"] = None
    out["certification"] = None

    out["claimed_impact_co2_tons"] = np.nan
    out["actual_impact_co2_tons"] = np.nan
    out["impact_source"] = None

    def mk_id(row):
        yr = row.get("issue_year")
        ctry = str(row.get("country", "")).replace(" ", "_")
        btype = str(df.loc[row.name, "Bond_Type"]).replace(" ", "_")
        return f"KAPSARC-{yr}-{ctry}-{btype}"

    out["bond_id"] = out.apply(mk_id, axis=1)

    for col in COMMON_COLS:
        if col not in out.columns:
            out[col] = np.nan

    return out[COMMON_COLS]


# ------------------------------
# CLIMATE BONDS INITIATIVE EXPORT
# ------------------------------

def normalize_cbi(path: Path) -> pd.DataFrame:
    """
    Normalize Climate Bonds Initiative 'bonds_export.csv' to common schema.
    Expected columns (subset):
      'Issuer / Applicant', 'Issue date',
      'Size (in issuance currency)', 'Size (USD equivalent)',
      'Term', 'Issuer Country', 'Sector Criteria',
      'Approved Verifier', 'Status', 'Certification type', 'Description'
    """
    df = pd.read_csv(path)

    out = pd.DataFrame()
    out["source_dataset"] = "cbi"
    out["isin"] = None  # not present in export (unless in another column)

    out["issuer_name"] = df["Issuer / Applicant"]
    out["issuer_type"] = None  # not provided; could infer later by heuristics
    out["country"] = df["Issuer Country"]

    out["currency"] = None  # 'Size (in issuance currency)' is a text field

    def parse_size_local(val: str) -> Optional[float]:
        if pd.isna(val):
            return None
        # e.g. "AUD 100m" or "USD 18.884m"
        parts = str(val).split()
        if len(parts) < 2:
            return None
        num_part = parts[1].lower()
        try:
            if num_part.endswith("bn"):
                return float(num_part[:-2]) * 1e9
            if num_part.endswith("m"):
                return float(num_part[:-1]) * 1e6
            return float(num_part)
        except Exception:
            return None

    out["amount_issued"] = df["Size (in issuance currency)"].apply(parse_size_local)
    out["amount_issued_usd"] = df["Size (USD equivalent)"]

    out["issue_date"] = pd.to_datetime(df["Issue date"], errors="coerce")
    out["issue_year"] = out["issue_date"].dt.year

    out["maturity_date"] = None
    out["maturity_year"] = np.nan

    out["use_of_proceeds"] = df["Sector Criteria"]

    # External review: Approved Verifier name
    out["external_review_type"] = df["Approved Verifier"]

    # Certification info
    out["certification"] = df["Certification type"].fillna("CBI Certified")

    out["claimed_impact_co2_tons"] = np.nan
    out["actual_impact_co2_tons"] = np.nan
    out["impact_source"] = None

    def mk_id(row):
        issuer = str(row["issuer_name"]).replace(" ", "_")[:20]
        date = row["issue_date"]
        if isinstance(date, pd.Timestamp):
            return f"CBI-{issuer}-{date.date().isoformat()}"
        return f"CBI-{issuer}-{row.name}"

    out["bond_id"] = out.apply(mk_id, axis=1)

    for col in COMMON_COLS:
        if col not in out.columns:
            out[col] = np.nan

    return out[COMMON_COLS]


# ------------------------------
# KAGGLE
# ------------------------------

def normalize_kaggle(path: Path) -> pd.DataFrame:
    """
    Normalize Kaggle 'Global Sustainable Bonds Data.csv' to common schema.

    Expected columns:
      'Issuer Name', 'Issuer location', 'Issuer sector',
      'Bond type', 'Bonds per type', 'Amount issued (USD bn.)',
      'Lastest External Review Form', 'External  Reviewer\\n',
      'Latest External Review Report'

    If another Kaggle file is passed that does not match this schema
    (e.g. index or ETF NAV), we currently skip it for bonds.csv.
    """
    df = pd.read_csv(path)

    cols = set(df.columns)
    if "Issuer Name" not in cols or "Amount issued (USD bn.)" not in cols:
        print(
            f"[normalize_kaggle] File {path} does not look like "
            "'Global Sustainable Bonds Data.csv' – skipping."
        )
        return pd.DataFrame(columns=COMMON_COLS)

    out = pd.DataFrame()
    out["source_dataset"] = "kaggle_global_sustainable"

    out["issuer_name"] = df["Issuer Name"]
    out["country"] = df["Issuer location"]
    out["issuer_type"] = df["Issuer sector"]

    # Use of proceeds / label (green/social/sustainability, etc.)
    out["use_of_proceeds"] = df["Bond type"]

    # Amount issued in USD
    def parse_amount_usd(val: str) -> Optional[float]:
        """
        Convert strings like '0.57bn' to numeric USD amount (0.57 * 1e9).
        """
        if pd.isna(val):
            return None
        s = str(val).strip().lower()
        try:
            if s.endswith("bn"):
                return float(s[:-2]) * 1e9
            if s.endswith("m"):
                # occasionally might show as millions
                return float(s[:-1]) * 1e6
            return float(s)
        except Exception:
            return None

    out["amount_issued_usd"] = df["Amount issued (USD bn.)"].apply(
        parse_amount_usd
    )
    out["amount_issued"] = out["amount_issued_usd"]  # no local-currency breakdown

    # Dates are not explicit in this dataset; we leave them blank
    out["issue_date"] = pd.NaT
    out["issue_year"] = np.nan
    out["maturity_date"] = pd.NaT
    out["maturity_year"] = np.nan

    # External review info
    form_col = "Lastest External Review Form"
    reviewer_col = "External  Reviewer\n"
    form = df.get(form_col)
    reviewer = df.get(reviewer_col)

    def combine_review(row):
        f = str(row.get(form_col, "")).strip()
        r = str(row.get(reviewer_col, "")).strip()
        if f and r and f != "nan" and r != "nan":
            return f"{f} by {r}"
        if r and r != "nan":
            return r
        if f and f != "nan":
            return f
        return None

    if form is not None or reviewer is not None:
        out["external_review_type"] = df.apply(combine_review, axis=1)
    else:
        out["external_review_type"] = None

    # Certification – keep simple for now (could later mark CBI/GBP alignment separately)
    out["certification"] = df["Bond type"]

    # Impact metrics – this dataset doesn't have CO2/MWh impacts
    out["claimed_impact_co2_tons"] = np.nan
    out["actual_impact_co2_tons"] = np.nan
    out["impact_source"] = None

    # ISIN not present
    out["isin"] = None

    # bond_id synthetic: issuer + row index
    def mk_id(row):
        issuer = str(row["issuer_name"]).strip().replace(" ", "_")[:30]
        idx = row.name
        return f"KAG-{issuer}-{idx}"

    out["bond_id"] = out.apply(mk_id, axis=1)

    # Make sure all common columns exist
    for col in COMMON_COLS:
        if col not in out.columns:
            out[col] = np.nan

    return out[COMMON_COLS]


# ------------------------------
# ADB PLACEHOLDER
# ------------------------------

def normalize_adb(path: Path) -> pd.DataFrame:
    """
    Placeholder for ADB Green & Blue Bond Impact Report.
    The Excel layout is complex (multiple sections / headings).

    For now, returns an empty frame. Later will:
      - Identify project rows
      - Aggregate to bond-level (if there's a bond identifier)
      - Map CO2/MWh metrics into claimed/actual impact.
    """
    _ = pd.read_excel(path)
    # TODO: parse actual impact metrics and map to bonds
    return pd.DataFrame(columns=COMMON_COLS)


# ------------------------------
# MAIN
# ------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Build unified bonds.csv from multiple green bond sources."
    )
    parser.add_argument("--world-bank", type=Path, help="World Bank green bonds CSV")
    parser.add_argument("--kapsarc", type=Path, help="KAPSARC green-bond-issuances CSV")
    parser.add_argument("--cbi", type=Path, help="Climate Bonds Initiative export CSV")
    parser.add_argument("--kaggle", type=Path, help="Kaggle green bonds CSV (optional)")
    parser.add_argument("--adb", type=Path, help="ADB Green & Blue Bond Impact Excel (optional)")
    parser.add_argument("--output", type=Path, required=True, help="Output unified CSV path")

    args = parser.parse_args()

    frames: List[pd.DataFrame] = []

    if args.world_bank and args.world_bank.exists():
        print(f"Loading World Bank dataset from {args.world_bank}")
        frames.append(normalize_world_bank(args.world_bank))

    if args.kapsarc and args.kapsarc.exists():
        print(f"Loading KAPSARC dataset from {args.kapsarc}")
        frames.append(normalize_kapsarc(args.kapsarc))

    if args.cbi and args.cbi.exists():
        print(f"Loading CBI dataset from {args.cbi}")
        frames.append(normalize_cbi(args.cbi))

    if args.kaggle and args.kaggle.exists():
        print(f"Loading Kaggle dataset from {args.kaggle}")
        frames.append(normalize_kaggle(args.kaggle))

    if args.adb and args.adb.exists():
        print(f"Loading ADB dataset from {args.adb}")
        frames.append(normalize_adb(args.adb))

    if not frames:
        raise SystemExit("No input datasets found. Provide at least one.")

    combined = pd.concat(frames, ignore_index=True)

    # Drop obvious duplicates by ISIN when present
    if "isin" in combined.columns:
        combined = combined.drop_duplicates(subset=["isin", "bond_id"], keep="first")

    # Ensure all common columns present
    for col in COMMON_COLS:
        if col not in combined.columns:
            combined[col] = np.nan

    combined = combined[COMMON_COLS]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(args.output, index=False)
    print(f"Wrote unified bonds file with {len(combined)} rows to {args.output}")


if __name__ == "__main__":
    main()
