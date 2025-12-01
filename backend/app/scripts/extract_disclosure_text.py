#!/usr/bin/env python3
# backend/scripts/extract_disclosure_text.py

import os
import pathlib
import json
from pypdf import PdfReader   # or use fitz for PyMuPDF if preferred

RAW_DIR = pathlib.Path(__file__).resolve().parents[2] / "app" / "data" / "disclosures_raw"
OUT_DIR = pathlib.Path(__file__).resolve().parents[2] / "app" / "data" / "disclosures_texts"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_from_pdf(pdf_path: pathlib.Path) -> str:
    reader = PdfReader(str(pdf_path))
    texts = []
    for page in reader.pages:
        try:
            txt = page.extract_text()
        except Exception as e:
            print("Failed on page:", e)
            txt = ""
        if txt:
            texts.append(txt)
    return "\n".join(texts)

def clean_text(text: str) -> str:
    # minimal cleaning — you can expand
    return text.replace("\r", "\n").strip()

def main():
    for root, dirs, files in os.walk(RAW_DIR):
        for fname in files:
            if not fname.lower().endswith(".pdf"):
                continue
            pdf_path = pathlib.Path(root) / fname
            out_path = OUT_DIR / (pdf_path.stem + ".txt")
            try:
                raw = extract_from_pdf(pdf_path)
                cleaned = clean_text(raw)
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(cleaned)
                print("Extracted:", pdf_path, "→", out_path)
            except Exception as e:
                print("Error extracting", pdf_path, e)

if __name__ == "__main__":
    main()
