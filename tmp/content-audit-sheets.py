import json,pathlib,textwrap
from PIL import Image,ImageDraw,ImageFont
root=pathlib.Path(r'C:\Users\Administrator\Documents\ChatGPT\分级阅读绘本')
src=root/'output/browser-trial-15-20261027'
out=root/'output/content-audit-15-20261027';out.mkdir(exist_ok=True)
p=json.loads((src/'expected-print.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',22)
small=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',18)
for b in p['books']:
 leaves=[(i,l) for i,l in enumerate(p['pages']) if l['kind']=='story' and l['bookId']==b['id']]
 sheet=Image.new('RGB',(1200,55+((len(leaves)+2)//3)*470),'#eeeeea');d=ImageDraw.Draw(sheet)
 d.text((12,10),str(b['number'])+' '+b['title'],font=font,fill='black')
 for n,(i,l) in enumerate(leaves):
  im=Image.open(src/'rendered'/f'page-{i+1:03d}.png').convert('RGB');w,h=im.size
  im=im.crop((int(w*.08),int(h*.118),int(w*.92),int(h*.74)));im.thumbnail((378,365))
  x=(n%3)*400+10;y=55+(n//3)*470
  sheet.paste(im,(x,y+25))
  d.text((x,y),f'P{n+1} / PDF {i+1}',font=small,fill='black')
  text=''.join(b['pages'][n])
  for j,line in enumerate(textwrap.wrap(text,16)):
   d.text((x,y+385+j*25),line,font=font,fill='black')
 sheet.save(out/f"book-{b['number']:02d}.jpg",quality=94)
print(out)
