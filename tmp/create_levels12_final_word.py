from pathlib import Path
import json,re,hashlib
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

root=Path(__file__).resolve().parents[1]
out=root/'output/levels12-final-word-20261027';out.mkdir(parents=True,exist_ok=True)
first=json.loads((root/'output/level1-approved-15-20261026/第一级15篇-用户指定文稿.json').read_text('utf-8'))['books']
def display(s):return s.replace('CHILD','【孩子名字】').replace('“','"').replace('”','"')
books=[{'number':b['number'],'title':display(b['title']),'text':' '.join(map(display,b['paragraphs']))} for b in first]
second=[
('大鞋和小鞋','这是我的小鞋。 这是爸爸的大鞋，我也要穿。 我穿上大鞋，大鞋真大。 我一走，小脚从大鞋里出来了！ 我走不好，又出来了。 我放下大鞋，穿好小鞋。 小脚和小鞋一起走，真好！'),
('我还不想睡','天晚了，我还不想睡。 "小鸟，小鸟，来和我玩！" 小鸟在树上睡了。 "小猫，来和我玩！" 小猫在小床上睡了。 我把小车放好，关上门。门关好了。 "小车，你也睡吧。" 好吧，我也要睡了，明天再玩吧。'),
('早上好','今天，我早早起来了。 我要和爸爸出门玩。 我穿好衣服，穿好鞋。 爸爸还在睡！ "爸爸，快起来！我都穿好了！" 爸爸起来了，也去穿衣服、穿鞋。 我在门口等爸爸。 我们都穿好了，我们一起出门。'),
('这水太热了','我玩了半天，口好干。 我想喝水。 这水太热了，我还不能喝。 我把水放一放，等一等。 等啊等，等啊等。 我摸一摸，水不热了！ 我能喝了。 我喝一口，再喝一口。 真好喝！'),
('小花喝水','小花渴了，我拿小水壶。 我给小花喝水。 一点，再一点。 小虫爬到叶子下。 "小虫，小虫，下雨啦！" 我放好小水壶，等一等。 小虫又爬出来了。 "雨不下了！小虫，出来玩吧！"'),
('小球也要走','我把小球放在小车前。 我推小车，小车推着小球走。 我把小球放在小车后。 我推小车，小球没有动，一动也不动。 我把小车拿回来，把小球放进去。 我再推，再推小车，小球也一起走了！'),
('小纸片飞了','我有一片红纸。 风来了，小纸片飞了！ 纸片飞起来，飞到左边，我跑到左边，跑啊跑。 纸片飞到右边，我又跑到右边，跑啊跑。 小纸片下来了，我把它拿回来。 我拿小石头压住纸片。 风又来了，纸片不飞了！ 我不用跑了！'),
('谁先笑','"爸爸，我们都不笑！" 爸爸看着我，我看着爸爸。 我把两只小手放在头上。 "爸爸，我是小兔！" 爸爸不笑。 我把小手放在脸上。 "爸爸，我是小猫！" 爸爸笑了。 "爸爸，你先笑了！"我们都笑了。'),
('大果子和小果子','我有两个果子，一个大，一个小。 今天，朋友来我家玩。 我和朋友说："大的给你，小的给我。" 我把大果子给朋友。 朋友吃了一个，说："对，真好吃！" 我又吃一个，说："小的也好吃！" 朋友笑了，说："你真好！"'),
('谁还在睡','我和爸爸来看日出。 天还黑着，天黑黑的，太阳还没起来。 "太阳，我都起来了，你还不起来吗？" 我坐下来，等一等。等着等着，我睡着了。 "快看，太阳出来了！"爸爸叫我。 我一看，看见了天边红红的，太阳真的出来了！ 爸爸笑着说："太阳起来了，你还在睡呢！"'),
('水中的月亮','天上有月亮，水中也有月亮。 我和小兔在水边。 小兔喝水，水动了。 水中的月亮不见了！我看不见了！ "小兔，你把月亮喝下去了吗？" 小兔不喝了，水不动了。 水中的月亮又回来了！'),
('我和小兔','我看小白兔。 小兔的耳朵长长的，我的耳朵小小的。 小鸟在叫，小兔在听，我也在听。小鸟在树上叫。 小兔的眼睛红红的，我的眼睛黑黑的。 我笑了，小兔看见了我的牙。 "小兔，你的牙呢？你的小牙呢？" 我拿一片菜叶给小兔。 小兔一吃，我也看见了它的小牙，小小的牙！'),
('我跳过去了','小兔会跳，我也要学。 小兔跳过小石头。 我跳了一下，没有过去。 小石头太高了。 我把小纸片放在地上。 "我先跳过小纸片吧。" 我跳！这回，我过去了！ "小兔，你看，我跳过去了！"'),
('小火车','我给小火车画一条路。 这条路太小，火车过不去。 我再画一条大大的路。 这回，小火车开过去了！ 我还画上绿树和红花，画在路边。 "小火车，从这条路开走吧！" 小火车开走了。'),
('小鱼的新家','这是我画的一条小鱼。 "小鱼，你的家在哪？" 我给小鱼画水，画一个家。 我再画水中的草和小石头，还有大石头。 "小鱼，这是你的新家！你的家在水里！" 我把自己画在水中。 "小鱼，我要来和你玩！"')]
books += [{'number':n,'title':title,'text':text} for n,(title,text) in enumerate(second,16)]
lists={
'level1':'小 我 了 来 的 一 在 你 也 有 不 车 看 水 上 下 片 把 球 头 走 石 和 是 这 回 花 口 猫 家 开 中 要 玩 树 鸟 叫 见 个 呢 高 手 伞 山 云 好 吗 两 出 没 去 床 大 又 拿 谁 笑 红 雨 名 字',
'level2_existing':'亮 兔 再 到 吃 吧 喝 天 太 放 月 爸 画 着 睡 穿 等 纸 给 起 跳 边 过 还 鞋 鱼',
'level2_promoted':'个 中 动 又 友 子 家 推 是 朋 条 火 牙 石 虫 要 见 说 跑 路 都 门 阳 飞 鸟 黑',
'level2_assisted':'半 干 摸 脸 渴'}
source={'title':'分级阅读 · 第一、二级终稿','basis':'用户2026年10月27日所发终稿；正文与字表原样保留，不改写、不调整字表归属或标注数量。','wordLists':lists,'books':books}
(out/'终稿内容.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),'utf-8')
doc=Document();sec=doc.sections[0];sec.page_width=Inches(8.5);sec.page_height=Inches(11)
sec.top_margin=sec.bottom_margin=Inches(.7);sec.left_margin=sec.right_margin=Inches(.8);sec.footer_distance=Inches(.3)
def setfont(style,name,size,bold=False):
 style.font.name=name;style.font.size=Pt(size);style.font.bold=bold;style.font.color.rgb=RGBColor(0,0,0)
 rf=style.element.get_or_add_rPr().get_or_add_rFonts()
 for attr in ['ascii','hAnsi','eastAsia','cs']:rf.set(qn('w:'+attr),name)
 for attr in ['asciiTheme','hAnsiTheme','eastAsiaTheme','cstheme']:rf.attrib.pop(qn('w:'+attr),None)
 lang=OxmlElement('w:lang');lang.set(qn('w:val'),'zh-CN');lang.set(qn('w:eastAsia'),'zh-CN');style.element.get_or_add_rPr().append(lang)
setfont(doc.styles['Normal'],'宋体',12)
normal=doc.styles['Normal'].paragraph_format;normal.line_spacing=Pt(21);normal.space_after=Pt(11);normal.widow_control=True
for name,size in [('Title',23),('Heading 1',17),('Heading 2',14)]:
 setfont(doc.styles[name],'黑体',size,True);fmt=doc.styles[name].paragraph_format;fmt.keep_with_next=True;fmt.space_before=Pt(14 if name!='Title' else 0);fmt.space_after=Pt(8)
setfont(doc.styles['Subtitle'],'宋体',11);doc.styles['Subtitle'].font.italic=False;doc.styles['Subtitle'].paragraph_format.space_after=Pt(12)
for el in list(doc.styles.element.iter(qn('w:pBdr'))):el.getparent().remove(el)
for el in doc.styles.element.iter(qn('w:lang')):el.set(qn('w:val'),'zh-CN');el.set(qn('w:eastAsia'),'zh-CN')
kinsoku=OxmlElement('w:kinsoku');kinsoku.set(qn('w:val'),'1');doc.styles['Normal'].element.get_or_add_pPr().append(kinsoku)
doc.add_paragraph('分级阅读第一二级终稿','Title')
doc.add_paragraph('第一级15册　第二级15册　完整正文与字表','Subtitle')
doc.add_paragraph('第一级','Heading 1');doc.add_paragraph('15册 · 必认61字')
p=doc.add_paragraph();p.add_run('字表：').bold=True;p.add_run(lists['level1'])
for b in books:
 if b['number']==16:
  p=doc.add_paragraph('第二级','Heading 1');p.paragraph_format.page_break_before=True
  doc.add_paragraph('15册 · 新增必认52字 · 辅助5字')
  p=doc.add_paragraph();p.add_run('新增必认字：').bold=True;p.add_run(lists['level2_existing']+'（26个，现成） '+lists['level2_promoted']+'（26个，转正）')
  p=doc.add_paragraph();p.add_run('辅助字（看图猜，待第三级转正）：').bold=True;p.add_run(lists['level2_assisted'])
 doc.add_paragraph(str(b['number'])+'.《'+b['title']+'》','Heading 2')
 p=doc.add_paragraph();p.paragraph_format.keep_together=True
 if b['number']==2:
  for i,line in enumerate(first[1]['paragraphs']):
   if i:p.add_run().add_break()
   p.add_run(display(line))
 else:p.add_run(b['text'])
footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
run=footer.add_run();run.font.size=Pt(9);field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');run._r.addnext(field)
doc.core_properties.title='分级阅读第一二级终稿';doc.core_properties.subject='第一、二级完整30篇正文及字表';doc.core_properties.author=''
file=out/'分级阅读第一二级终稿.docx';doc.save(file)
check=Document(file);paragraphs=[p.text for p in check.paragraphs];compact=lambda s:re.sub(r'\s+','',s)
for b in books:
 heading=str(b['number'])+'.《'+b['title']+'》';i=paragraphs.index(heading);assert compact(paragraphs[i+1])==compact(b['text']),b['number']
assert sum(p.style.name=='Heading 2' for p in check.paragraphs)==30
for value in lists.values():assert compact(value) in compact('\n'.join(paragraphs))
(out/'文字核对.json').write_text(json.dumps({'stories':30,'exactWordingMatchIgnoringLayoutWhitespace':True,'allWordListsPreserved':True,'wordListLabelsPreservedAsProvided':True,'file':str(file),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()},ensure_ascii=False,indent=2),'utf-8')
print(file)
