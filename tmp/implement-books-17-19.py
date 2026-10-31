import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'little-protagonist'
def edit(name, pairs):
    p=root/name;raw=p.read_bytes();text=raw.decode('utf8').replace('\r\n','\n')
    for before,after in pairs:
        assert before in text,(name,before)
        text=text.replace(before,after)
    p.write_bytes(text.replace('\n','\r\n').encode('utf8') if b'\r\n' in raw else text.encode('utf8'))

p=root/'content/child-pose-library.json';data=json.loads(p.read_text(encoding='utf8'));data['version']=9
data['poses']['eat-fruit']={'id':'eat-fruit','version':1,'model':'child-v1','bodyUrl':'./art/sequence/books-17-19/eat-fruit.webp','collar':{'x':501,'y':225},'bounds':{'left':176,'top':88,'right':843,'bottom':1401},'headRotation':0,'attachments':{'bite':{'x':445,'y':105},'rightPalm':{'x':610,'y':495}}}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
edit('preview/ui-functions.js',[("wagon:'小主角推车带小球的插画'","wagon:'小主角推车带小球的插画',paper:'小主角追纸片和用石头压纸的插画',fruit:'小主角与伙伴分享大小果子的插画',catbed:'小主角收好玩具让小猫睡觉的插画'")])
edit('tests/layered-art.test.cjs',[("'watering','wagon'];","'watering','wagon','paper','fruit','catbed'];"),('all 108 non-family pages','all 132 non-family pages'),('0),108);','0),132);'),('sixteen shelf covers','nineteen shelf covers')])
edit('tests/stories.test.cjs',[("books 4–16","books 4–19"),("'watering', 'wagon']);","'watering', 'wagon', 'paper', 'fruit', 'catbed']);"),('illustrated book 16','illustrated book 19'),('[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]','[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]'),('[6, 8, 8, 6, 8, 8, 8, 6, 8, 8, 6, 8, 8]','[6, 8, 8, 6, 8, 8, 8, 6, 8, 8, 6, 8, 8, 8, 8, 8]')])
edit('tests/print-service.test.cjs',[('plan.storyCount,16','plan.storyCount,19'),('lastStory,16','lastStory,19')])
edit('tests/print-plan.test.cjs',[("updated second volume has six complete chapters","six-story second-volume regression has six complete chapters"),("books(defaultMembers()).slice(10),{volumeNumber:2,volumeCount:2});assert.equal(p.pageCount,53)","books(defaultMembers()).slice(10,16),{volumeNumber:2,volumeCount:2});assert.equal(p.pageCount,53)")])
p=root/'content/level1-stories-11-20.json';d=json.loads(p.read_text(encoding='utf8'));d['status']='partially-illustrated-through-book-19';d['introduction']=d['introduction'].replace('第11至16本','第11至19本').replace('第17至20本仍为','第20本仍为');p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
edit('AGENTS.md',[('前16个','前19个'),('（11—16）','（11—19）'),('第2册6个故事','第2册9个故事')])
edit('README.md',[('第4至16本通过','第4至19本通过'),('上架十六本','上架十九本'),('现有16本不代表','现有19本不代表'),('前16个故事已完成','前19个故事已完成'),('第11—16个作为第2册','第11—19个作为第2册'),('第11—16本，共44页正文、6页识字小结','第11—19本，共68页正文、9页识字小结'),('阅读PDF为53个','阅读PDF为80个'),('章节号11—16','章节号11—19'),('1、8、17、26、33、42。','1、8、17、26、33、42、51、60、69。'),('与49页连续A5书芯','与76页连续A5书芯'),('若选择骑马订需由印厂安排3个必要补齐面，尚未套用','当前80页无需按4的倍数额外补齐，骑马订仍由印厂审稿决定'),('第2册更新为6故事/53页校样','第2册现更新为9故事/80页校样')])
print('Integrated books 17–19 and registered eat-fruit action; retained original manuscript wording.')
