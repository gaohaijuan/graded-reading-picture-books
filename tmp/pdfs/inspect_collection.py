import json
import re
import unicodedata
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont
from pypdf import PdfReader
import pdfplumber

root = Path(__file__).resolve().parents[2]
pdf = root / 'output/pdf/小小主角-第1级六故事合集-A5阅读校样.pdf'
plan = json.loads((Path(__file__).parent / 'expected-plan.json').read_text(encoding='utf-8'))
reader = PdfReader(pdf)
books = {b['id']: b for b in plan['books']}
normalize = lambda value: re.sub(r'\s+', '', unicodedata.normalize('NFKC', value))
results = []
with pdfplumber.open(pdf) as document:
    for number, (page, leaf, text_page) in enumerate(zip(reader.pages, plan['pages'], document.pages), 1):
        image = Image.open(Path(__file__).parent / f'page-{number:02}.png').convert('RGB')
        pixels = np.asarray(image).astype(np.int16)
        difference = np.max(np.abs(pixels - np.array([251, 246, 233])), axis=2)
        ink_ratio = float(np.mean(difference > 30))
        text = text_page.extract_text() or ''
        width = float(page.mediabox.width) * 25.4 / 72
        height = float(page.mediabox.height) * 25.4 / 72
        record = dict(page=number, kind=leaf['kind'], book=leaf.get('bookId'),
                      width_mm=round(width, 4), height_mm=round(height, 4),
                      ink_ratio=round(ink_ratio, 4), blank=ink_ratio < .002,
                      text=text, words_inside_page=all(0 <= c['x0'] <= c['x1'] <= float(page.mediabox.width) + .5
                          and -.5 <= c['top'] <= c['bottom'] <= float(page.mediabox.height) + .5
                          for c in text_page.chars))
        if leaf['kind'] == 'story':
            expected = books[leaf['bookId']]['pages'][leaf['page']]
            record['expected_text'] = expected
            record['all_story_text_present'] = all(normalize(line) in normalize(text) for line in expected)
            # The exported raster is a whole leaf. Check its physical art panel
            # for non-paper pixels separately from the vector text below it.
            w, h = image.size
            art = difference[round(h * 24 / 210):round(h * 155 / 210),
                             round(w * 12 / 148):round(w * 136 / 148)]
            record['art_ink_ratio'] = round(float(np.mean(art > 30)), 4)
            record['art_present'] = record['art_ink_ratio'] > .04
            body = normalize(''.join(expected))
            record['body_text_in_lower_panel'] = any(c['top'] > float(page.mediabox.height) * .72
                                                     for c in text_page.chars if normalize(c['text']) in body)
        results.append(record)

summary = dict(file=str(pdf), bytes=pdf.stat().st_size, pages=len(reader.pages),
               expected_pages=plan['pageCount'], story_pages=sum(p['kind'] == 'story' for p in results),
               blank_pages=[p['page'] for p in results if p['blank']],
               non_a5_pages=[p['page'] for p in results if abs(p['width_mm'] - 148) > .01 or abs(p['height_mm'] - 210) > .01],
               missing_art=[p['page'] for p in results if p.get('art_present') is False],
               missing_story_text=[p['page'] for p in results if p.get('all_story_text_present') is False],
               text_outside_page=[p['page'] for p in results if not p['words_inside_page']],
               chapters=plan['chapters'])
(root / 'output/pdf/合集检查结果.json').write_text(json.dumps(dict(summary=summary, pages=results), ensure_ascii=False, indent=2), encoding='utf-8')
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 18)
small = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 15)
for sheet in range(2):
    subset = results[sheet * 25:(sheet + 1) * 25]
    canvas = Image.new('RGB', (1100, 1715), '#e9e9e4')
    draw = ImageDraw.Draw(canvas)
    draw.text((18, 12), f'A5 合集实际 PDF 页面总览 · {sheet * 25 + 1}–{sheet * 25 + len(subset)} 页', fill='#26382c', font=font)
    for offset, row in enumerate(subset):
        image = Image.open(Path(__file__).parent / f"page-{row['page']:02}.png").convert('RGB')
        image.thumbnail((202, 289))
        x, y = 10 + offset % 5 * 220, 50 + offset // 5 * 330
        canvas.paste(image, (x + (202 - image.width) // 2, y))
        draw.text((x + 4, y + 293), f"PDF 第 {row['page']} 页", fill='#26382c', font=small)
    canvas.save(root / f'output/pdf/合集页面总览-{sheet + 1}.jpg', quality=94)

# These are direct PDF renders, not screenshots of the application's preview.
selected = [1, 2, 3, 9, 17, 24, 31, 40, 50]
for number in selected:
    source = Path(__file__).parent / f'page-{number:02}.png'
    Image.open(source).save(root / f'output/pdf/实际PDF-第{number:02}页.png')
print(json.dumps(summary, ensure_ascii=False, indent=2))
