import json, re, pathlib, hashlib
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageOps, ImageDraw
root=pathlib.Path(__file__).resolve().parent.parent/'output/browser-trial-15-20261027'
pdf=root/'个性化打印流程测试.pdf'
plan=json.loads((root/'expected-print.json').read_text(encoding='utf-8'))
reader=PdfReader(pdf)
native=pdfium.PdfDocument(str(pdf))
assert len(reader.pages)==plan['pageCount']==118
normalize=lambda s: re.sub(r'\s+','',s)
texts=[]
for index,(page,leaf) in enumerate(zip(reader.pages,plan['pages'])):
    media=[float(page.mediabox.width)*25.4/72,float(page.mediabox.height)*25.4/72]
    trim=[float(page.trimbox.width)*25.4/72,float(page.trimbox.height)*25.4/72]
    assert all(abs(a-b)<.02 for a,b in zip(media,[154,216])), (index,media)
    assert all(abs(a-b)<.02 for a,b in zip(trim,[148,210])), (index,trim)
    text=normalize(native[index].get_textpage().get_text_range())
    assert text,(index,'missing vector text')
    if leaf['kind']=='story':
        book=next(b for b in plan['books'] if b['id']==leaf['bookId'])
        expected=normalize(''.join(book['pages'][leaf['page']]))
        assert expected in text,(index+1,expected,text)
    if leaf['kind']=='summary': assert '识字小结' in text
    if leaf['kind']=='contents':
        for chapter in plan['chapters']:
            assert normalize(chapter['title']) in text,chapter
            assert str(chapter['startFolio']) in text,chapter
    texts.append({'page':index+1,'kind':leaf['kind'],'text':text})
(root/'pdf-validation.json').write_text(json.dumps({'pages':len(reader.pages),'bodyPages':plan['storyPageCount'],
    'summaryPages':plan['summaryCount'],'bytes':pdf.stat().st_size,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),
    'mediaMm':[154,216],'trimMm':[148,210],'texts':texts},ensure_ascii=False,indent=2),encoding='utf-8')
files=sorted((root/'rendered').glob('page-*.png'))
assert len(files)==118, len(files)
for offset in range(0,len(files),24):
    sheet=Image.new('RGB',(6*180,4*270),'#d7d7d7');draw=ImageDraw.Draw(sheet)
    for i,file in enumerate(files[offset:offset+24]):
        image=Image.open(file).convert('RGB');image.thumbnail((170,240))
        x=(i%6)*180+(180-image.width)//2;y=(i//6)*270+20
        sheet.paste(image,(x,y));draw.text(((i%6)*180+7,(i//6)*270+3),str(offset+i+1),fill='black')
    sheet.save(root/f'contact-{offset//24+1}.jpg',quality=90)
print(json.dumps({'pages':118,'bodyPages':plan['storyPageCount'],'MiB':round(pdf.stat().st_size/1024**2,2),'textAndPageBoxes':'passed','montages':5}))
