import io,json,zipfile
from pathlib import Path
from pypdf import PdfReader
root=Path(__file__).resolve().parents[2]
archive=Path('C:/Users/Administrator/Downloads/小石头-我家有几口人？-印厂包.zip')
with zipfile.ZipFile(archive) as z:
    manifest=json.loads(z.read('清单.json'))
    quality=manifest['sourceQuality']
    assert quality['completeLayerAudit'] is True
    assert quality['native300Ppi'] is False
    assert len(quality['pages'])==8
    assert all(p['characterPipeline']=='composed-actor-v1' and p['layers'] for p in quality['pages'])
    assert all(l['nativeEffectivePpi']>0 for p in quality['pages'] for l in p['layers'])
    pdfs={name:PdfReader(io.BytesIO(z.read(name))) for name in z.namelist() if name.lower().endswith('.pdf')}
    pdf_sizes={name:[[round(float(p.mediabox.width)*25.4/72,2),round(float(p.mediabox.height)*25.4/72,2)] for p in pdf.pages] for name,pdf in pdfs.items()}
    for pdf in pdfs.values():
        for p in pdf.pages:
            width=round(float(p.mediabox.width)*25.4/72)
            expected=[297,210] if width==303 else [148,210]
            assert [round(float(p.trimbox.width)*25.4/72),round(float(p.trimbox.height)*25.4/72)]==expected
    report={'sourceQuality':quality,'pdf_sizes_mm':pdf_sizes}
    (root/'output/pdf/家庭分层迁移-逐层有效像素检查.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'quality_pages':len(quality['pages']),'background_min_ppi':quality['minimumBackgroundPpi'],'all_measured_layers_min_ppi':quality['minimumMeasuredPpi'],'native300Ppi':quality['native300Ppi'],'sample_layers':quality['pages'][0]['layers'],'pdf_sizes_mm':pdf_sizes},ensure_ascii=False,indent=2))
