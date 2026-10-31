from pathlib import Path
import hashlib
import json
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/manuscript-level1-complete-review/第一级30篇完整文案-待确认.json'
OUT = ROOT / 'output/level1-first-version-word'
OUT.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
manuscript = json.loads(SOURCE.read_text(encoding='utf-8'))
books = manuscript['books']
assert [b['number'] for b in books] == list(range(1, 31))
assert books[1]['title'] == '下雪了'
assert books[28]['title'] == '小火车'
assert books[18]['paragraphs'][2] == '我把水放一放，等一等。'

def display(text):
    return text.replace('CHILD', '【孩子名字】')

doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = section.bottom_margin = Inches(0.75)
section.left_margin = section.right_margin = Inches(0.85)
section.footer_distance = Inches(0.3)

def font(style, name, size, bold=False):
    style.font.name = name
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor(0, 0, 0)
    props = style.element.get_or_add_rPr()
    rfonts = props.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        props.insert(0, rfonts)
    for attr in ('ascii', 'hAnsi', 'eastAsia', 'cs'):
        rfonts.set(qn('w:' + attr), name)
    for attr in ('asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme'):
        rfonts.attrib.pop(qn('w:' + attr), None)
    lang = OxmlElement('w:lang')
    lang.set(qn('w:val'), 'zh-CN')
    lang.set(qn('w:eastAsia'), 'zh-CN')
    props.append(lang)

font(doc.styles['Normal'], '宋体', 12)
normal = doc.styles['Normal'].paragraph_format
normal.line_spacing = Pt(18)
normal.space_before = normal.space_after = Pt(0)
normal.widow_control = True
font(doc.styles['Title'], '黑体', 22)
doc.styles['Title'].paragraph_format.space_after = Pt(7)
doc.styles['Title'].paragraph_format.keep_with_next = True
font(doc.styles['Subtitle'], '宋体', 11)
doc.styles['Subtitle'].paragraph_format.space_after = Pt(17)
doc.styles['Subtitle'].paragraph_format.keep_with_next = True
font(doc.styles['Heading 1'], '黑体', 14, True)
heading = doc.styles['Heading 1'].paragraph_format
heading.space_before = Pt(13)
heading.space_after = Pt(6)
heading.line_spacing = Pt(20)
heading.keep_with_next = True

doc.add_paragraph('第一级别第一版', style='Title')
doc.add_paragraph('第一级阅读文稿  共30篇', style='Subtitle')
expected = []
for book in books:
    title = f"第{book['number']}篇《{display(book['title'])}》"
    doc.add_paragraph(title, style='Heading 1')
    expected.append(title)
    for i, line in enumerate(book['paragraphs']):
        p = doc.add_paragraph(display(line))
        p.paragraph_format.keep_with_next = i < len(book['paragraphs']) - 1
        p.paragraph_format.keep_together = True
        expected.append(display(line))

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run()
run.font.name = '宋体'
run.font.size = Pt(9)
run.font.color.rgb = RGBColor(0, 0, 0)
field = OxmlElement('w:fldSimple')
field.set(qn('w:instr'), 'PAGE')
run._r.addnext(field)
doc.core_properties.title = '第一级别第一版'
doc.core_properties.subject = '第一级阅读文稿 30篇'
doc.core_properties.author = ''
doc.core_properties.last_modified_by = ''
doc.core_properties.comments = ''

output = OUT / '第一级别第一版.docx'
doc.save(output)
saved = Document(output)
assert [p.text for p in saved.paragraphs][2:] == expected, '导出文字与当前30篇源文稿不一致'
assert len([p for p in saved.paragraphs if p.style.name == 'Heading 1']) == 30
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
(OUT / 'content_verification.json').write_text(json.dumps({
    'source': str(SOURCE), 'source_sha256': source_hash,
    'output': str(output), 'stories': 30,
    'all_titles_and_story_paragraphs_exactly_match': True,
    'source_unchanged': True
}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'output': str(output), 'stories': 30, 'text_match': True}, ensure_ascii=False))
