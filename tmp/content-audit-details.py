import pathlib
import pypdfium2 as p
root=pathlib.Path(r'C:\Users\Administrator\Documents\ChatGPT\分级阅读绘本')
doc=p.PdfDocument(str(root/'output/browser-trial-15-20261027/个性化打印流程测试.pdf'))
for n in [3,61,74,80,81,82,99,105,107,113]:
 page=doc[n-1];im=page.render(scale=2).to_pil();im.save(root/f'output/content-audit-15-20261027/pdf-{n:03d}.png')
