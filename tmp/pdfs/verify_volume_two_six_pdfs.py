import argparse, json, re, unicodedata, subprocess
from pathlib import Path
import numpy as np
import pdfplumber
from pypdf import PdfReader
from PIL import Image,ImageDraw,ImageFont

parser=argparse.ArgumentParser();parser.add_argument('pdf');parser.add_argument('--photo',action='store_true');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];pdf=Path(args.pdf).resolve();tag='第2册六故事真人长名字' if args.photo else '第2册六故事合集'
work=root/'tmp/pdfs'/('volume-two-six-photo' if args.photo else 'volume-two-six-default');work.mkdir(parents=True,exist_ok=True)
out=root/'output/pdf';out.mkdir(parents=True,exist_ok=True)
poppler=Path('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
subprocess.run([str(poppler),'-r','80','-png',str(pdf),str(work/'page')],check=True)
order=['tree','calling','catball','shoes','watering','wagon'];name='小小云朵和小太阳' if args.photo else '小石头'
manuscript=json.loads((root/'little-protagonist/content/level1-stories-11-20.json').read_text(encoding='utf8'))['books'][:6]
titles=[book['title'] for book in manuscript]
body=[{'book':id,'page':i,'text':''.join(lines)} for id,book in zip(order,manuscript) for i,lines in enumerate(book['pages'])]
expected_literacy=json.loads((root/'browser-test/volume-two-six-expected-literacy.json').read_text(encoding='utf8'))['photo' if args.photo else 'default']
expected_literacy={row['id']:row for row in expected_literacy}
plan=[{'kind':'front'},{'kind':'contents'}];chapters=[];folio=1
for book,title in zip(order,titles):
    rows=[row for row in body if row['book']==book]
    chapters.append({'book':book,'title':title,'start_folio':folio,'start_pdf_page':len(plan)+1,'body_pages':len(rows)})
    for row in rows:plan.append({'kind':'story','book':book,'expected':row['text']})
    plan.append({'kind':'summary','book':book});folio+=len(rows)+1
plan.append({'kind':'back'})
normalize=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
reader=PdfReader(pdf);assert len(reader.pages)==len(plan)
checks=[]
with pdfplumber.open(pdf) as document:
    toc=normalize(document.pages[1].extract_text() or '')
    for c in chapters:assert normalize(c['title'])+str(c['start_folio']) in toc,(c,toc)
    for number,(page,kind,tp) in enumerate(zip(reader.pages,plan,document.pages),1):
        im=Image.open(work/f'page-{number:02}.png').convert('RGB');a=np.asarray(im).astype(np.int16);diff=np.max(np.abs(a-np.array([251,246,233])),axis=2)
        text=tp.extract_text() or '';h,w=diff.shape
        row={'page':number,'kind':kind['kind'],'book':kind.get('book'),'size_mm':[round(float(v)*25.4/72,3) for v in (page.mediabox.width,page.mediabox.height)],'blank':float(np.mean(diff>30))<.002,'vector_characters':len(tp.chars),'text_inside':all(-.5<=c['x0']<=c['x1']<=float(page.mediabox.width)+.5 and -.5<=c['top']<=c['bottom']<=float(page.mediabox.height)+.5 for c in tp.chars),'text':text}
        if kind['kind']=='summary':
            expected=expected_literacy[kind['book']]
            values=normalize(tp.crop((0,84*72/25.4,float(page.mediabox.width),100*72/25.4)).extract_text() or '')
            metrics=''.join(str(expected[k])+'字' for k in ['count','newCount','cumulativeCount'])
            row['literacy_matches']=metrics in values and ''.join(expected['characters']) in normalize(text)
        if kind['kind']=='story':
            row['body_present']=normalize(kind['expected']) in normalize(text)
            row['art_present']=float(np.mean(diff[round(h*24/210):round(h*155/210),round(w*8/148):round(w*140/148)]>30))>.04
            row['body_below_art']=any(c['top']>float(page.mediabox.height)*.74 for c in tp.chars if normalize(c['text']) in normalize(kind['expected']))
        if kind['kind'] in ['story','summary']:
            footer=''.join(c['text'] for c in tp.chars if c['top']>float(page.mediabox.height)*.92)
            row['continuous_folio']=footer.strip().endswith(str(number-2))
        checks.append(row)
fonts=[];seen=set()
def scan(res):
    if not res:return
    for ref in res.get('/Font',{}).values():
        font=ref.get_object()
        for f in [font]+[v.get_object() for v in font.get('/DescendantFonts',[])]:
            desc=f.get('/FontDescriptor')
            if desc:
                desc=desc.get_object();fonts.append({'name':str(f.get('/BaseFont')),'embedded':any(k in desc for k in ['/FontFile','/FontFile2','/FontFile3'])})
    for ref in res.get('/XObject',{}).values():
        key=(getattr(ref,'idnum',None),getattr(ref,'generation',None))
        if key in seen:continue
        seen.add(key);x=ref.get_object()
        if x.get('/Subtype')=='/Form':scan(x.get('/Resources'))
for page in reader.pages:scan(page.get('/Resources'))
summary={'file':str(pdf),'pages':len(checks),'body_pages':len(body),'chapters':chapters,'fonts':list({f['name']:f for f in fonts}.values()),'errors':[]}
for row in checks:
    for key in ['blank']:
        if row[key]:summary['errors'].append([row['page'],key])
    if row['size_mm']!=[148.0,210.0]:summary['errors'].append([row['page'],'non_A5'])
    for key in ['text_inside','body_present','art_present','body_below_art','continuous_folio','literacy_matches']:
        if row.get(key) is False:summary['errors'].append([row['page'],key])
    if not row['vector_characters']:summary['errors'].append([row['page'],'raster_only'])
assert fonts and all(f['embedded'] for f in fonts)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',17)
for part in range((len(checks)+24)//25):
    sheet=Image.new('RGB',(1100,1715),'#e9e9e4');d=ImageDraw.Draw(sheet);d.text((16,10),f'{tag} · 实际PDF第 {part*25+1}–{min(len(checks),(part+1)*25)} 页',font=font,fill='#26382c')
    for i in range(min(25,len(checks)-part*25)):
        n=part*25+i+1;im=Image.open(work/f'page-{n:02}.png').convert('RGB');im.thumbnail((202,289));x=10+(i%5)*220;y=50+(i//5)*330;sheet.paste(im,(x+(202-im.width)//2,y));d.text((x+4,y+293),f'PDF 第 {n} 页',font=font,fill='#26382c')
    sheet.save(out/f'{tag}-总览-{part+1}.jpg',quality=94)
(out/f'{tag}-实际PDF检查.json').write_text(json.dumps({'summary':summary,'pages':checks},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(summary,ensure_ascii=False,indent=2));assert not summary['errors']
