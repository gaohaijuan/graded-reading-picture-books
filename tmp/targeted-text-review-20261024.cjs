'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const workspace=path.resolve(__dirname,'..');
const root=path.join(workspace,'little-protagonist');
const {listBooks}=require(path.join(root,'miniprogram/lib/stories'));
const {defaultMembers}=require(path.join(root,'miniprogram/lib/family'));
const {uniqueHan}=require(path.join(root,'miniprogram/lib/literacy'));
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const current=listBooks({name:'CHILD',age:5,className:'大班'},defaultMembers(),{includeApproved:true}).map((b,i)=>({...b,number:i+1}));
const old=[...current,...read('content/level1-stories-21-40.json').books.filter(b=>b.number>=21&&b.number<=30)];
const characterPlan=read('content/level1-character-plan.json');
const allowed=new Set(characterPlan.characters);
const inputFiles=['miniprogram/lib/stories.js','miniprogram/lib/level1-approved.js','content/level1-stories-04-10.json','content/level1-stories-11-20.json','content/level1-stories-21-40.json','content/level1-character-plan.json'];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const before=inputFiles.map(file=>({file,sha256:hash(file)}));
const proposed=[
  {number:5,title:'下雨了',reason:'删掉没有写清关联的云、风铺垫，直接从下雨开始。云和风留在看山、追纸等确有用途的情节中。',paragraphs:[
    '下雨了！',
    '小伞开了。我在伞下。',
    '小花在雨中。',
    '“小花，来！”小花不来。',
    '“花不来，我去！”',
    '我在伞下，小花也在伞下。',
    '雨在伞上，伞下有我，也有花。'
  ]},
  {number:13,title:'小猫要小球吗',reason:'写明孩子推球，小猫跑来参与；不再让小球没有主语地来去。',paragraphs:[
    '我有一个红球。',
    '我有一个黄球。',
    '“小猫，你要小球吗？”',
    '“红球给你。黄球也给你。”',
    '小猫不来玩。',
    '我把小球推过去。',
    '小猫跑来了！',
    '我和小猫一起玩！'
  ]},
  {number:14,title:'大鞋和小鞋',reason:'正文用“大人的鞋”，不按孩子性别规定鞋子的主人或鞋型。画面暂以普通成人平底鞋为通用设定；本次不改插画。',paragraphs:[
    '这是我的小鞋。',
    '这是大人的鞋，我也要穿。',
    '我穿上大鞋。',
    '一走，小脚出来了！',
    '我穿好小鞋。',
    '这回，小脚和小鞋一起走。'
  ]},
  {number:18,title:'大果子和小果子',reason:'去掉没有动作的来去和反复互让，只写一次清楚的分享；不再为了页数补空话。',paragraphs:[
    '我有两个果子，一个大，一个小。',
    '朋友来我家玩，也想吃果子。',
    '我说：“大的给你，小的给我。”',
    '我把大果子给朋友。',
    '朋友吃了一口：“真好吃！”',
    '我也吃一口：“小的也好吃！”'
  ]},
  {number:20,title:'我还不想睡',reason:'删去小车在鞋里及对小车反复邀玩的情节，明确是孩子放好玩具、和它道晚安的游戏式拟人。',paragraphs:[
    '天晚了，我还不想睡。',
    '“小鸟，来和我玩！”',
    '小鸟在树上睡了。',
    '“小猫，来和我玩！”',
    '小猫在小床上睡了。',
    '我把小车放好：“小车，你也睡吧。”',
    '好吧，我也要睡了。'
  ]},
  {number:21,title:'早上好',reason:'改成孩子先收拾好、反过来等爸爸出门的小情节，删掉鞋里小车起床的牵强呼应。爸爸是审稿示例中的实际出场家人，未按性别自动决定角色。',paragraphs:[
    '今天，我早早起来了。',
    '我要和爸爸出门玩。',
    '我穿好衣，穿好鞋。',
    '爸爸还在睡！',
    '“爸爸，快起来！我都穿好了！”',
    '爸爸起来了，也去穿衣、穿鞋。',
    '我在门口等爸爸。',
    '“爸爸，快来！我们出门吧！”'
  ]},
  {number:22,title:'看日出',reason:'不替原稿猜测末尾的“你”是谁；结尾直接写孩子明天还来看日出。',paragraphs:[
    '今天，我来看日出。',
    '天还黑着，小鸟还没有叫。',
    '天边红了。',
    '看，日出！',
    '小鸟叫了，我也笑了。',
    '“小鸟，早上好！”',
    '明天，我还来看日出。'
  ]},
  {number:24,title:'这水太热了',reason:'采用“还不能喝”；只保留同一杯水由太热到能喝的等待过程，去掉冷水对照和给花喝水的岔线。',paragraphs:[
    '我想喝水。',
    '这水太热了，我还不能喝。',
    '我把水放好，等一等。',
    '水不热了！这回，我能喝了。',
    '我喝一口，再喝一口。'
  ]},
  {number:26,title:'长纸和短纸',reason:'撤回纸桥提案：普通薄纸架空不能默认承载玩具车。新提案把纸平铺在地上，只比较纸路能否铺到家门口，不宣称短纸会挡车或让车开不过去。车由地面支撑；仍待用户确认，未改原文或插画。',paragraphs:[
    '我有两张纸，一张长，一张短。',
    '我要给小车的家做条路。',
    '我把短纸放在地上。',
    '纸太短，还没到家门口。',
    '我拿走短纸，放上长纸。',
    '这回，纸路到家门口了。',
    '我把小车放在纸上，推到家门口。',
    '“小车回家了！”'
  ]},
  {number:27,title:'小虫过小山',reason:'保留上下山、孩子停下后小虫继续走的变化，去掉不必要的土、脚、边、前后等负担。简化后可接在“山不见了”后试排，最终序号尚不改。',paragraphs:[
    '我在山下，小虫也在山下。',
    '我上山，小虫也上山。',
    '我下山了，小虫在山上。',
    '我坐下来，看小虫。',
    '小虫过了小山。',
    '我坐在山下，小虫走了。',
    '“小虫，我也来！”',
    '我也走了。'
  ]},
  {number:28,title:'我和小兔',reason:'使用正常词“耳朵”“眼睛”；去掉“耳在，眼也在”的空话和水中观察支线。题目改为能涵盖身体观察的“我和小兔”。单说“牙”在这里是正常口语，不为凑字故意截词。',paragraphs:[
    '我看小白兔。',
    '小兔的耳朵长长的，我的耳朵小小的。',
    '小鸟在叫，小兔在听，我也在听。',
    '小兔的眼睛红红的，我的眼睛黑黑的。',
    '小兔看看我，我也看看它。',
    '我一笑，小兔看见了我的牙。',
    '“小兔，你的牙呢？”'
  ]}
];
for(const b of proposed){
  const original=old.find(o=>o.number===b.number);
  const prior=new Set(uniqueHan(old.filter(o=>o.number<b.number).flatMap(o=>o.pages.flat()).join('')));
  b.originalTitle=original.title;
  b.originalParagraphs=original.pages.map(p=>p.join(''));
  b.status='proposal-awaiting-user-review';
  b.outsideWorkingCharacterList=uniqueHan(b.paragraphs.join('')).filter(c=>!allowed.has(c));
  b.firstExposuresAtOldPosition=uniqueHan(b.paragraphs.join('')).filter(c=>!prior.has(c));
}
const bug=proposed.find(b=>b.number===27);
const positions=[7,8,10,11,12,14,16].map(after=>{
  const seen=new Set(uniqueHan(old.filter(b=>b.number<=after).flatMap(b=>b.pages.flat()).join('')));
  return {afterOldBook:after,afterTitle:old.find(b=>b.number===after).title,
    originalNewCharacters:uniqueHan(old.find(b=>b.number===27).pages.flat().join('')).filter(c=>!seen.has(c)),
    proposedNewCharacters:uniqueHan(bug.paragraphs.join('')).filter(c=>!seen.has(c))};
});
const sourceChanges=before.filter(f=>hash(f.file)!==f.sha256);
if(sourceChanges.length)throw Error('Unexpected original source changes.');
const result={status:'proposal-awaiting-user-review',basis:'只针对用户指出的旧顺序11篇；未使用已撤回v9，不改前3篇，不修改当前书架、正文源稿、插画或PDF。',
  originalNumberingRetained:true,proposed,bugPositionAnalysis:positions,sourcesUnchanged:before};
const out=path.join(workspace,'output/manuscript-feedback-20261024');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'11篇逐条处理建议-待确认.json'),JSON.stringify(result,null,2)+'\n');
const lines=['旧顺序11篇：逐条处理建议（待确认）','只保存审阅提案；没有覆盖原文、换序、改图或重做PDF。','新增字按真实正文列出，不把自然表达当成无限增加难词的许可。',''];
for(const b of proposed)lines.push(`第${b.number}篇《${b.title}》`,b.reason,'建议正文：',...b.paragraphs,'工作字表以外的字：'+(b.outsideWorkingCharacterList.join('、')||'无'),'');
lines.push('第27篇顺序：先做前移试排，尚未改变当前目录。是否认识不能仅凭前文出现过判断。');
fs.writeFileSync(path.join(out,'11篇逐条处理建议-待确认.txt'),lines.join('\n'));
console.log(JSON.stringify({outsidePlan:proposed.map(b=>({number:b.number,characters:b.outsideWorkingCharacterList})),bugPositionAnalysis:positions,sourceChanges,out},null,2));
