import fitz  # PyMuPDF
import sys
import json

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        return text
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf_pymupdf.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    print(extract_text_from_pdf(pdf_path))
