from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).parent
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',20)
for book,count in [('intro',6),('flower',6),('family',7),('hands',6),('rain',8),('stone',8)]:
    sheet=Image.new('RGB',(1110,((count+2)//3)*550),'#e9e9e4');d=ImageDraw.Draw(sheet)
    for p in range(1,count+1):
        im=Image.open(root/f'layered-default-{book}-{p}.jpg').crop((313,77,743,685)).convert('RGB');im.thumbnail((350,500))
        x=((p-1)%3)*370+10;y=((p-1)//3)*550+10;sheet.paste(im,(x,y));d.text((x,y+505),f'{book} · {p}',font=font,fill='#26382c')
    sheet.save(root/f'layered-contact-{book}.jpg',quality=95)
