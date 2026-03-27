from pypdf import PdfReader

reader = PdfReader("04 Oct '25 - Problem Statement _ Expense Management (2).pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open("problem-statement.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("PDF parsed successfully using PyPDF2")
