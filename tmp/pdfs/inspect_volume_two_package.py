import io,json,zipfile
from pathlib import Path
from pypdf import PdfReader
root=Path(__file__).resolve().parents[2]
archive=Path('C:/Users/Administrator/Downloads/小石头-第1级阅读故事集 · 第2册（现有3个故事样册）-印厂包.zip')
with zipfile.ZipFile(archive) as z:
    manifest=json.loads(z.read('清单.json'));q=manifest['sourceQuality']
    assert q['completeLayerAudit'] is True and q['native300Ppi'] is False
    assert {p['bookId'] for p in q['pages']}=={'tree','calling','catball'}
    assert all(p['characterPipeline']=='composed-actor-v1' and p['layers'] for p in q['pages'])
    assert sum(p['kind']=='story' for p in q['pages'])==22
    assert all(l['nativeEffectivePpi'] is not None and l['nativeEffectivePpi']>0 for p in q['pages'] for l in p['layers'])
    summary={};folder=root/'tmp/pdfs/volume-two-press';folder.mkdir(parents=True,exist_ok=True)
    for key,name in [('outer','封面-外侧与内侧.pdf'),('inner','书芯-A5按阅读顺序.pdf')]:
        data=z.read(name);pdf=PdfReader(io.BytesIO(data));sizes=[]
        for p in pdf.pages:
            to_mm=lambda x:round(float(x)*25.4/72,3)
            media=[to_mm(p.mediabox.width),to_mm(p.mediabox.height)];trim=[to_mm(p.trimbox.width),to_mm(p.trimbox.height)]
            assert media==([303.,216.] if key=='outer' else [154.,216.]);assert trim==([297.,210.] if key=='outer' else [148.,210.])
            assert [to_mm(p.trimbox.left),to_mm(p.trimbox.bottom)]==[3.,3.]
            assert list(p.bleedbox)==list(p.mediabox)
            sizes.append({'media_mm':media,'trim_mm':trim,'bleed_each_mm':3})
        assert len(pdf.pages)==(2 if key=='outer' else 24)
        (folder/(key+'.pdf')).write_bytes(data);summary[key]={'pages':len(pdf.pages),'size':sizes[0]}
    by_book={}
    for p in q['pages']:
        r=by_book.setdefault(p['bookId'],{'layers':0,'minimum_native_ppi':100000})
        r['layers']+=len(p['layers']);r['minimum_native_ppi']=min(r['minimum_native_ppi'],*(l['nativeEffectivePpi'] for l in p['layers']))
    report={'quality':q,'books':by_book,'pdfs':summary,'reading_pages':28}
    (root/'output/pdf/第2册-逐层像素与印厂包检查.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'minimum_measured_ppi':q['minimumMeasuredPpi'],'complete_layer_audit':q['completeLayerAudit'],'native_300ppi':q['native300Ppi'],'books':by_book,'pdfs':summary},ensure_ascii=False,indent=2))
