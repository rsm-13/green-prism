"""
text preprocessing utilities (cleaning, tokenization wrapper, etc.)
"""


def clean_text(text: str | None) -> str:
    # return empty string for falsy input, otherwise normalize whitespace
    if not text:
        return ""
    return " ".join(str(text).split())
