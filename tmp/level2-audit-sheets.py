import json,pathlib
from PIL import Image,ImageDraw,ImageFont
root=pathlib.Path(r'C:\Users\Administrator\Documents\ChatGPT\分级阅读绘本');out=root/'output/level2-illustration-audit-20261028';out.mkdir(exist_ok=True)
books=json.loads((root/'tmp/level2-audit-books.json').read_text(encoding='utf-8'))
f=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',22)
for b in books:
 source=root/'output'/('level2-first-twelve-20261028' if b['levelNumber']<=12 else 'level2-last-three-20261028')/'qa'
 n=len(b['pages']);sheet=Image.new('RGB',(1200,50+((n+2)//3)*590),'#e7e7e2');d=ImageDraw.Draw(sheet);d.text((10,10),str(b['levelNumber'])+' '+b['title'],font=f,fill='black')
 for i in range(n):
  path=source/f"{b['id']}-{i+1:02d}.png";im=Image.open(path).convert('RGB');im.thumbnail((390,550))
  x=(i%3)*400;y=50+(i//3)*590;d.text((x+8,y),'正文第'+str(i+1)+'页',font=f,fill='black');sheet.paste(im,(x+(400-im.width)//2,y+30))
 sheet.save(out/f"book-{b['levelNumber']:02d}.jpg",quality=93)
print('15 story contact sheets ready')
