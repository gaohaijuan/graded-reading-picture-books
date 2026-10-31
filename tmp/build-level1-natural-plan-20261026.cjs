'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const sourcePath=path.join(root,'output/level1-child-centered-review-20261026/第一级30篇完整文案-待确认.json');
const canonicalPath=path.join(root,'output/manuscript-level1-complete-review/第一级30篇完整文案-待确认.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sourceHash=hash(sourcePath),canonicalHash=hash(canonicalPath);
assert.equal(sourceHash,canonicalHash);
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const oldAudit=JSON.parse(fs.readFileSync(path.join(root,'output/level1-child-centered-review-20261026/覆盖与复现统计.json'),'utf8'));
const targets=[...JSON.parse(fs.readFileSync(path.join(root,'little-protagonist/content/level1-character-plan.json'),'utf8')).characters];
const edits=require('./level1-natural-plan-20261026.cjs');
const candidate=source.books.map(b=>({...b,...edits[b.number],status:'proposal-only-not-applied'}));
const han=s=>s.match(/\p{Script=Han}/gu)||[];
const length=b=>han(b.paragraphs.join('')).length;
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const ideas={
3:'孩子画自己的全家，读者猜画里少了谁；最后孩子把自己画进去。真实家人只来自用户资料。',
4:'小手变小花、兔耳朵、爱心。孩子照着做，也能邀请家长一起玩。',
8:'保留把小草认成小虫的小误会。只交代山下、草丛、土上的位置和孩子走近观察。',
9:'玩具牛羊马坐小火车回家；马高出车厢，过不了入口，孩子把马拿下来，再把车和马分别放进家。全是玩具，不增设会说话的动物伙伴。',
10:'孩子找球，小狗叫声引路，发现球在床下的小猫旁；拿到球后邀请一起玩。',
11:'孩子今年又来和小树比高，站上石头才赢，下来又输了。保留孩子自己想办法的小转折。',
12:'孩子试笑、假哭、左右移动，发现水里的自己也照做；风把倒影弄乱，风停又出现。',
13:'保留误听小鸟在哭的情节；鸟妈妈从草丛带回小虫，解释小鸟在叫妈妈。',
14:'给猫看自己画的小鱼没反应，孩子换成拍球，小猫跑来追跳；兴趣转折来自孩子换玩法。',
15:'孩子嫌米饭多，妈妈拿走一点；吃完后说还想吃水果。用饭量与喜好形成小转折，不增加角色。',
16:'孩子试大人的雨鞋，小脚跑出来，自己换合脚的新鞋。雨衣、伞和关门都是同一次出门动作。',
17:'更换为图书找人：孩子在页内找弟弟妹妹，看到爷奶和哥姐；合上书才发现弟妹在书背面。书中人物均为虚构角色，不是用户家人。',
18:'同班朋友已来找孩子，孩子准备好了，爸爸还没起；热豆包等爸爸，孩子催他出门。朋友沿用已有普通朋友，不新增姓名或关系。',
19:'保留等热水变凉的时间，孩子拿第17篇同一本书，发现人物脚朝上，自己转正书；等待有了可玩的发现。',
20:'孩子种黄豆、妈妈种瓜。孩子给土浇水，盼着种子起床，过几天真的长出苗。',
21:'妈妈数到十，孩子到床下藏好，脚还露在外面；读者能先于孩子发现破绽。',
22:'孩子画的三张动物画被风吹走一张；找回、等猫离开、让画下的小虫走开，再用石头压住。动物是纸上的画。',
23:'保留憋笑游戏。孩子用手变兔耳和兔牙，再假哭，爸爸先笑；孩子的行动制造笑点。',
24:'孩子在生日时分蛋糕和水果，有片瓜少了一口；妈妈看到小牙印，孩子一笑就露了答案。',
25:'保留等日出却自己睡着的转折；穿衣应对清晨的冷，云变红和鸟叫对应天亮。',
26:'保留兔子喝水让月亮倒影消失的误会，孩子以为兔子喝掉月亮，水静了月亮又回来。',
27:'保留孩子模仿、观察兔子的耳朵与牙；通过给菜叶，终于看到兔牙。只轻调放菜动作。',
28:'孩子先没跳过高石头，改跳低纸片；连续跳十下，从怕冷到身上热，从失败到成功。',
29:'孩子根据朋友喜欢火车，画玩具动物坐火车的生日礼物；纸短画不下，自己换大纸。',
30:'孩子收到生日新书，照之前的阅读习惯找那六个故事人物，却看见自己种瓜、分水果，连名字也是自己的；把书带给朋友看。'
};
function row(term){
 const contexts=[];
 const perStory=candidate.map(b=>{let n=0;b.paragraphs.forEach((p,i)=>{const count=p.split(term).length-1;n+=count;if(count)contexts.push({story:b.number,paragraph:i+1,count,text:p});});return {story:b.number,count:n};}).filter(r=>r.count);
 return {term,totalOccurrences:perStory.reduce((s,r)=>s+r.count,0),distinctStories:perStory.length,storyNumbers:perStory.map(r=>r.story),perStory,contexts};
}
const targetRows=targets.map(row);
const all=candidate.flatMap(b=>han(b.paragraphs.join('')));
const auxiliary=[...new Set(all)].filter(c=>!targets.includes(c));
const auxRows=auxiliary.map(row);
const lowBefore=oldAudit.targetRows.filter(r=>r.distinctStories<3);
const rows99=lowBefore.map(r=>({...targetRows.find(t=>t.term===r.term),previousOccurrences:r.totalOccurrences,previousStories:r.storyNumbers,previousDistinctStories:r.distinctStories}));
assert.equal(rows99.length,99);
assert.equal(targetRows.filter(r=>r.distinctStories>=3).length,200);
for(const b of candidate) assert(length(b)<=length(source.books[b.number-1]),`第${b.number}篇超出原篇幅`);
for(const n of [1,2,5,6,7]){
 assert.deepEqual(candidate[n-1].paragraphs,source.books[n-1].paragraphs);
 assert.equal(candidate[n-1].title,source.books[n-1].title);
}
assert.equal(candidate[22].paragraphs.length,6);
assert(!/牛爷爷|牛奶奶|羊哥哥|羊妹妹|兔姐姐|兔弟弟/.test(JSON.stringify(candidate)));
for(const c of '爷奶哥姐弟妹') assert.deepEqual(row(c).storyNumbers,[17,19,30]);
// 用独立逐字符计数再核对，避免把标题/姓名、统计说明或方案词表算入正文。
const independent=new Map();
for(const b of candidate)for(const p of b.paragraphs)for(const c of han(p)){
 if(!independent.has(c))independent.set(c,{n:0,stories:new Set()});
 independent.get(c).n++;independent.get(c).stories.add(b.number);
}
for(const r of [...targetRows,...auxRows]){
 assert.equal(r.totalOccurrences,independent.get(r.term).n);
 assert.equal(r.distinctStories,independent.get(r.term).stories.size);
}
const perBook=candidate.map(b=>({number:b.number,oldNumber:b.oldNumber,previousTitle:source.books[b.number-1].title,proposedTitle:b.title,
 previousHan:length(source.books[b.number-1]),proposedHan:length(b),change:ideas[b.number]||'保持本轮前原文，不修改。',
 before:source.books[b.number-1].paragraphs,proposed:b.paragraphs}));
const summary={status:'proposal-not-applied',date:'2026-10-26',sourceTotalHan:oldAudit.current.totalHanOccurrences,
 candidateTotalHan:all.length,targetCount:200,candidateCoveredTargets:200,candidateTargetsAtLeastThreeStories:200,
 uniqueHan:new Set(all).size,auxiliaryCount:auxiliary.length,auxiliary,
 auxiliaryAdded:auxiliary.filter(c=>!oldAudit.current.auxiliary.includes(c)),
 auxiliaryRemoved:oldAudit.current.auxiliary.filter(c=>!auxiliary.includes(c)),
 totalThree:targetRows.filter(r=>r.totalOccurrences===3).length,totalFour:targetRows.filter(r=>r.totalOccurrences===4).length,
 everyStoryWithinOwnPreviousLength:true,changedBooks:Object.keys(edits).map(Number),
 productionManuscriptChanged:false,illustrationsGenerated:0,pdfsGenerated:0,
 sample:'沿用当前五岁、大班、三口家庭示例。女宝的倒影代词、实际年龄、班级、真实家人及生日朋友资料变更后，必须逐版本重算；本次未声称所有配置已生成并验证。'};
const out=path.join(root,'output/level1-natural-story-plan-20261026');fs.mkdirSync(out,{recursive:true});
const write=(name,v)=>fs.writeFileSync(path.join(out,name),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n','utf8');
write('具体修改方案与试排核查.json',{summary,sourcePath,sourceHash,canonicalHash,perBook,missing19:rows99.filter(r=>!r.previousDistinctStories),underRepeated80:rows99.filter(r=>r.previousDistinctStories),targetRows,auxRows,wordRows:oldAudit.wordRows.map(r=>row(r.term))});
write('30篇具体怎么改-待确认方案.txt',[
 '30篇具体怎么改｜仅方案，未替换正文｜2026-10-26',
 '产品重点：孩子的真实形象、名字、家人进入有行动、有小困难和结果的故事；孩子能猜、能参与、能照着玩。识字控制为这种阅读体验提供支撑。',
 '不通过增加篇幅或虚构用户家人补字。家庭字在一本虚构图画书中三次出现，阅读者一直是孩子。原200字不删；每个定制版本都须独立满足覆盖和复现要求。',
 `为核实可行性，内部试排30篇：${oldAudit.current.totalHanOccurrences}→${all.length}个正文汉字；每篇均未超过自己原来的长度；200字全部出现且每字至少在3篇。正式文稿仍为此前版本。`,
 summary.sample,
 `字表外${auxiliary.length}字单列：${auxiliary.join('、')}。完整词语不截断；字形、句式和每篇新字仍需随最终文稿一起审阅，不能仅靠200字频次判断难度。`,
 '第1、2、5、6、7篇不动；第3篇获本次明确要求，单独改为画全家的参与游戏。第23篇仍为6段。段落不代表新增打印页。',
 ...perBook.flatMap(b=>['',`${b.number}.《${display(b.previousTitle)}》→《${display(b.proposedTitle)}》｜原第${b.oldNumber}篇｜${b.previousHan}→${b.proposedHan}字`,b.change,
   ...(ideas[b.number]?['拟用正文（试排，未采用）：',...b.proposed.map(display)]:[])])
].join('\n')+'\n');
write('19个缺字与80个复现不足字-逐字安排.txt',[
 '只列此前缺失或跨篇不足3次的99个目标字。以下为方案试排位置，不能当作当前已沿用文稿的字频。',
 '字\t此前覆盖篇数\t此前篇号\t拟稿总次数\t拟稿覆盖篇数\t拟稿篇号',
 ...rows99.map(r=>`${r.term}\t${r.previousDistinctStories}\t${r.previousStories.join('、')||'无'}\t${r.totalOccurrences}\t${r.distinctStories}\t${r.storyNumbers.join('、')}`)
].join('\n')+'\n');
write('200字全部复现-试排核查.txt','只统计试排正文，标题、姓名占位符、方案说明不计。\n字\t总次数\t篇数\t篇号\n'+targetRows.map(r=>`${r.term}\t${r.totalOccurrences}\t${r.distinctStories}\t${r.storyNumbers.join('、')}`).join('\n')+'\n');
write('完整30篇试排示例-非采用稿.txt',['仅为验证方案篇幅和字频的试排示例。尚未采用，正式文稿未改。',...candidate.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n');
write('表外字与首次出现-试排核查.txt',[
 '本文件不能代替难度判断。正常完整词保留，如耳朵、眼睛、玩具、蛋糕。原200字表未修改。',
 `表外共${auxiliary.length}字；较当前稿新增${summary.auxiliaryAdded.length}字：${summary.auxiliaryAdded.join('、')}；不再使用：${summary.auxiliaryRemoved.join('、')}。`,
 '字\t次数\t篇号',...auxRows.map(r=>`${r.term}\t${r.totalOccurrences}\t${r.storyNumbers.join('、')}`)
].join('\n')+'\n');
assert.equal(hash(canonicalPath),canonicalHash);assert.equal(hash(sourcePath),sourceHash);
write('方案校验结果.json',{passed:true,checks:['200字全覆盖且各至少3篇','每篇字数不增加','统计独立复核一致','原采用文稿哈希未变','第1、2、5、6、7篇不动','第23篇保持6段','六个亲属字只在17、19、30篇的阅读场景','未出图、未生成PDF'],summary});
console.log(JSON.stringify({out,summary,missing19:rows99.filter(r=>!r.previousDistinctStories).map(r=>({c:r.term,s:r.storyNumbers})),low80:rows99.filter(r=>r.previousDistinctStories).length},null,2));
