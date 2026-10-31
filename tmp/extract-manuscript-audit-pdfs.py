import json
from pathlib import Path
from pypdf import PdfReader

workspace = Path(__file__).resolve().parents[1]
out = workspace / 'output' / 'manuscript-audit'
out.mkdir(parents=True, exist_ok=True)
files = [workspace / 'output/pdf/小小主角-前十本合集-竖版A5校样.pdf',
         workspace / 'output/pdf/小小主角-第2册-竖版A5校样.pdf']
result = []
for volume, file in enumerate(files, 1):
    reader = PdfReader(file)
    result.append({'volume': volume, 'file': str(file), 'pages': [
        {'pdfPage': i + 1, 'text': page.extract_text() or ''}
        for i, page in enumerate(reader.pages)
    ]})
(out / 'pdf-text-evidence.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps([{'volume': x['volume'], 'pages': len(x['pages'])} for x in result], ensure_ascii=False))
