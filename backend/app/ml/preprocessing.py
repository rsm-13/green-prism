"""
Text preprocessing utilities (cleaning, tokenization wrapper, etc.)
"""


def clean_text(text: str | None) -> str:
    if not text:
        return ""
    return " ".join(str(text).split())
