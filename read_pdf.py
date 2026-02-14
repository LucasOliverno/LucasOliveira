
import sys
try:
    from pypdf import PdfReader
except ImportError:
    print("pypdf not installed")
    sys.exit(1)

reader = PdfReader("c:/Users/soare/Desktop/Apps/LucasOliveira/Projeto de estudo/Relatorio Final - Produçao de Ração para Gado Leiteiro.pdf")
text = ""
for page in reader.pages[:5]: # Read first 5 pages for summary
    text += page.extract_text() + "\n"
print(text)
