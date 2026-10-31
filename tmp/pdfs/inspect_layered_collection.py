import json, re, unicodedata
from pathlib import Path
import numpy as np
import pdfplumber
from pypdf import PdfReader
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[2]
pdf=root/'output/pdf/小小主角-家庭分层合成后-六故事A5校样.pdf'
plan=json.loads((Path(__file__).parent/'expected-plan.json').read_text(encoding='utf-8'))
books={b['id']:b for b in plan['books']}
normalize=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
reader=PdfReader(pdf)
assert len(reader.pages)==plan['pageCount']==50
rows=[]
with pdfplumber.open(pdf) as doc:
    for n,(page,leaf,textpage) in enumerate(zip(reader.pages,plan['pages'],doc.pages),1):
        im=Image.open(Path(__file__).parent/f'layered-page-{n:02}.png').convert('RGB')
        pixels=np.asarray(im).astype(np.int16)
        diff=np.max(np.abs(pixels-np.array([251,246,233])),axis=2)
        text=textpage.extract_text() or ''
        row={'page':n,'kind':leaf['kind'],'book':leaf.get('bookId'),
             'size_mm':[round(float(v)*25.4/72,3) for v in (page.mediabox.width,page.mediabox.height)],
             'blank':float(np.mean(diff>30))<.002,'vector_characters':len(textpage.chars),
             'text_inside':all(-.5<=c['x0']<=c['x1']<=float(page.mediabox.width)+.5 and -.5<=c['top']<=c['bottom']<=float(page.mediabox.height)+.5 for c in textpage.chars),'text':text}
        if leaf['kind']=='story':
            expected=books[leaf['bookId']]['pages'][leaf['page']]
            row['body_present']=all(normalize(line) in normalize(text) for line in expected)
            h,w=diff.shape
            row['art_present']=float(np.mean(diff[round(h*24/210):round(h*155/210),round(w*12/148):round(w*136/148)]>30))>.04
            row['body_below_art']=any(c['top']>float(page.mediabox.height)*.74 for c in textpage.chars if normalize(c['text']) in normalize(''.join(expected)))
        rows.append(row)
summary={'file':str(pdf),'pages':len(rows),'story_pages':sum(r['kind']=='story' for r in rows),
         'family_pages':[r['page'] for r in rows if r['book']=='family' and r['kind']=='story'],
         'blank_pages':[r['page'] for r in rows if r['blank']],
         'non_a5':[r['page'] for r in rows if r['size_mm']!=[148.0,210.0]],
         'missing_body':[r['page'] for r in rows if r.get('body_present') is False],
         'missing_art':[r['page'] for r in rows if r.get('art_present') is False],
         'body_position_errors':[r['page'] for r in rows if r.get('body_below_art') is False],
         'text_outside_page':[r['page'] for r in rows if not r['text_inside']],
         'raster_only_pages':[r['page'] for r in rows if not r['vector_characters']]}
fonts=[];seen=set()
def scan_resources(res):
    if not res:return
    for ref in res.get('/Font',{}).values():
        font=ref.get_object()
        for f in [font]+[v.get_object() for v in font.get('/DescendantFonts',[])]:
            desc=f.get('/FontDescriptor')
            if desc:
                desc=desc.get_object()
                fonts.append({'name':str(f.get('/BaseFont')),'embedded':any(k in desc for k in ['/FontFile','/FontFile2','/FontFile3'])})
    for ref in res.get('/XObject',{}).values():
        key=(getattr(ref,'idnum',None),getattr(ref,'generation',None))
        if key in seen:continue
        seen.add(key);x=ref.get_object()
        if x.get('/Subtype')=='/Form':scan_resources(x.get('/Resources'))
for p in reader.pages:scan_resources(p.get('/Resources'))
summary['fonts']=list({f['name']:f for f in fonts}.values())
(root/'output/pdf/家庭分层迁移-实际PDF检查.json').write_text(json.dumps({'summary':summary,'pages':rows},ensure_ascii=False,indent=2),encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',20)
for part in range(2):
    sheet=Image.new('RGB',(1100,1715),'#e9e9e4');draw=ImageDraw.Draw(sheet)
    draw.text((16,10),f'分层迁移后实际PDF · 第 {part*25+1}–{part*25+25} 页',font=font,fill='#26382c')
    for i in range(25):
        n=part*25+i+1;im=Image.open(Path(__file__).parent/f'layered-page-{n:02}.png').convert('RGB');im.thumbnail((202,289))
        x=10+(i%5)*220;y=50+(i//5)*330;sheet.paste(im,(x+(202-im.width)//2,y));draw.text((x+4,y+293),f'PDF 第 {n} 页',font=font,fill='#26382c')
    sheet.save(root/f'output/pdf/分层后合集总览-{part+1}.jpg',quality=94)
family=Image.open(Path(__file__).parent/'layered-page-17.png').convert('RGB')
family.save(root/'output/pdf/家庭分层后-实际A5页面.png')
print(json.dumps(summary,ensure_ascii=False,indent=2))
assert all(not summary[k] for k in ['blank_pages','non_a5','missing_body','missing_art','body_position_errors','text_outside_page','raster_only_pages'])
assert fonts and all(f['embedded'] for f in fonts)
