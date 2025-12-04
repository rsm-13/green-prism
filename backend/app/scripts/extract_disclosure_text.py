#!/usr/bin/env python3
# backend/scripts/extract_disclosure_text.py

import os
import pathlib
import json
from pypdf import PdfReader   # or use fitz for PyMuPDF if preferred

# directories: raw PDFs -> extracted txt outputs
RAW_DIR = (
    pathlib.Path(__file__).resolve().parents[2] / "app" / "data" / "disclosures_raw"
)
OUT_DIR = (
    pathlib.Path(__file__).resolve().parents[2] / "app" / "data" / "disclosures_texts"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_from_pdf(pdf_path: pathlib.Path) -> str:
    # read PDF and extract text from all pages, join with newlines
    reader = PdfReader(str(pdf_path))
    texts = []
    for page in reader.pages:
        try:
            txt = page.extract_text()
        except Exception as e:
            # continue on page-level extraction errors
            print("Failed on page:", e)
            txt = ""
        if txt:
            texts.append(txt)
    return "\n".join(texts)

def clean_text(text: str) -> str:
    # minimal cleaning: normalize windows CR, trim whitespace
    return text.replace("\r", "\n").strip()

def main():
    # walk the raw directory and process each PDF into a text file
    for root, dirs, files in os.walk(RAW_DIR):
        for fname in files:
            # skip non-pdf files
            if not fname.lower().endswith(".pdf"):
                continue
            pdf_path = pathlib.Path(root) / fname
            out_path = OUT_DIR / (pdf_path.stem + ".txt")
            try:
                # extract raw text, do light cleaning, write to output
                raw = extract_from_pdf(pdf_path)
                cleaned = clean_text(raw)
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(cleaned)
                print("Extracted:", pdf_path, "→", out_path)
            except Exception as e:
                # never fail the batch run for a single bad file
                print("Error extracting", pdf_path, e)

if __name__ == "__main__":
    main()
