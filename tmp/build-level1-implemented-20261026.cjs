'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const canonical = path.join(root, 'output/manuscript-level1-complete-review');
const out = path.join(root, 'output/level1-manuscript-implemented-20261026');
const baseline = path.join(out, 'baseline');
fs.mkdirSync(baseline, {recursive:true});
const file = '第一级30篇完整文案-待确认';
for (const ext of ['json','txt']) {
  const dest = path.join(baseline, `${file}.${ext}`);
  if (!fs.existsSync(dest)) fs.copyFileSync(path.join(canonical, `${file}.${ext}`), dest);
}
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const old = read(path.join(baseline, `${file}.json`));
const planPath = path.join(root, 'little-protagonist/content/level1-character-plan.json');
const planHash = hash(planPath);
const target = [...read(planPath).characters];
assert.equal(target.length, 200); assert.equal(new Set(target).size, 200);
const edits = require('./level1-implemented-texts-20261026.cjs');
const books = old.books.map(b => ({number:b.number, oldNumber:b.oldNumber,
  title:(edits[b.number] || b).title, paragraphs:(edits[b.number] || b).paragraphs,
  status:[1,2].includes(b.number)?'user-confirmed-parent-led':'text-draft-awaiting-user-review'}));
const han = s => s.match(/\p{Script=Han}/gu) || [];
const display = s => s.replaceAll('CHILD','【孩子名字】');
const occurrences = (s,t) => s.split(t).length-1;
function row(term, source=books) {
  const contexts = [];
  const perStory = source.map(b => {
    let count = 0;
    b.paragraphs.forEach((p,i) => {const n=occurrences(p,term);count+=n;if(n) contexts.push({story:b.number,paragraph:i+1,count:n,quote:p});});
    return {story:b.number,count};
  }).filter(r=>r.count);
  const nums=perStory.map(r=>r.story);
  return {term,totalOccurrences:perStory.reduce((n,r)=>n+r.count,0),distinctStories:nums.length,
    storyNumbers:nums,perStory,firstStory:nums[0]??null,nextStory:nums[1]??null,lastStory:nums.at(-1)??null,
    firstReturnStoryNumberGap:nums.length>1?nums[1]-nums[0]:null,
    largestStoryNumberGap:nums.length>1?Math.max(...nums.slice(1).map((v,i)=>v-nums[i])):null,contexts};
}
function summary(source) {
  const chars=source.flatMap(b=>han(b.paragraphs.join('')));
  const rows=target.map(c=>row(c,source));
  const all=[...new Set(chars)];
  return {stories:source.length,totalHanOccurrences:chars.length,uniqueHan:all.length,
    coveredTargets:rows.filter(r=>r.totalOccurrences).length,targetCount:target.length,
    missing:rows.filter(r=>!r.totalOccurrences).map(r=>r.term),
    targetOneStory:rows.filter(r=>r.distinctStories===1).length,
    targetTwoStories:rows.filter(r=>r.distinctStories===2).length,
    targetAtLeastThreeStories:rows.filter(r=>r.distinctStories>=3).length,
    auxiliary:all.filter(c=>!target.includes(c)),
    targetTotalThree:rows.filter(r=>r.totalOccurrences===3).map(r=>r.term),
    targetTotalFour:rows.filter(r=>r.totalOccurrences===4).map(r=>r.term),
    targetTotalAtLeastFive:rows.filter(r=>r.totalOccurrences>=5).length};
}
const targetRows=target.map(c=>row(c));
const current=summary(books), before=summary(old.books);
const auxiliaryRows=current.auxiliary.map(c=>row(c));
const previousAudit=read(path.join(root,'output/level1-vocabulary-audit-20261025/第一级词汇覆盖与复现核查.json'));
const extra='小火车 火车 牛爷爷 牛奶奶 爷爷 奶奶 羊哥哥 羊妹妹 哥哥 妹妹 兔姐姐 兔弟弟 姐姐 弟弟 朋友 自己 小球 小猫 小狗 小马 耳朵 眼睛 米饭 鸡蛋 豆子 红豆 黄豆 水果 西瓜 洗手 小牙 小勺 衣服 雨鞋 鞋子 面包 大班 生日 生日快乐 今年 明天 新书 一本 菜地 种豆 豆苗 小苗 低下头 低头 开心 喜欢 吃完 看书 小纸片 左边 右边 入口 出口 草丛 白云 日出 太阳 月亮 小鱼 名字 什么 躲'.split(' ');
const wordRows=[...new Set([...previousAudit.wordRows.map(r=>r.term),...extra])].map(t=>row(t));
const seen=new Set();
const perBook=books.map(b=>{
  const chars=han(b.paragraphs.join('')),unique=[...new Set(chars)];
  const newChars=unique.filter(c=>!seen.has(c)); unique.forEach(c=>seen.add(c));
  return {number:b.number,oldNumber:b.oldNumber,title:b.title,previousTitle:old.books.find(x=>x.number===b.number).title,
    hanOccurrences:chars.length,paragraphs:b.paragraphs.length,
    maxSentenceHan:Math.max(...b.paragraphs.flatMap(p=>p.split(/[。！？]/u).map(s=>han(s).length))),
    newCharacters:newChars,newTargetCharacters:newChars.filter(c=>target.includes(c)),
    newAuxiliaryCharacters:newChars.filter(c=>!target.includes(c))};
});
const protectedNumbers=[1,2,3,5,6,7];
assert.deepEqual(books.map(b=>b.number),Array.from({length:30},(_,i)=>i+1));
assert.equal(new Set(books.map(b=>b.oldNumber)).size,30);
for(const n of protectedNumbers) {
  assert.deepEqual(books[n-1].paragraphs,old.books[n-1].paragraphs);
  assert.equal(books[n-1].title,old.books[n-1].title);
}
assert.equal(current.coveredTargets,200);
assert.equal(current.targetAtLeastThreeStories,200);
assert.equal(books[22].paragraphs.length,6);
assert(!/数一数|数好了|咦/.test(books[2].paragraphs.join('')));
assert.equal(before.coveredTargets,157); assert.equal(before.totalHanOccurrences,1578);
// 独立按 Unicode 字符逐个核对，避免词频代码或占位符计数造成偏差。
const independent=new Map();
for(const b of books) for(const p of b.paragraphs) for(const c of p) if(/\p{Script=Han}/u.test(c)){
  if(!independent.has(c)) independent.set(c,{count:0,stories:new Set()});
  independent.get(c).count++; independent.get(c).stories.add(b.number);
}
for(const r of [...targetRows,...auxiliaryRows]){
  assert.equal(r.totalOccurrences,independent.get(r.term).count);
  assert.equal(r.distinctStories,independent.get(r.term).stories.size);
}
assert.equal(hash(planPath),planHash);
const changes=books.filter((b,i)=>b.title!==old.books[i].title || JSON.stringify(b.paragraphs)!==JSON.stringify(old.books[i].paragraphs)).map(b=>({number:b.number,oldNumber:b.oldNumber,beforeTitle:old.books[b.number-1].title,afterTitle:b.title,before:old.books[b.number-1].paragraphs,after:b.paragraphs}));
const manuscript={title:'第一级30篇完整文案·200字复现落实待确认稿',date:'2026-10-26',status:'text-draft-awaiting-user-review',
  basis:'将编排方案落实为30篇实际正文，按原200字表检查；未改字表、未把姓名或标题算入覆盖。',
  numbering:old.numbering,example:old.example,parentLedOpening:old.parentLedOpening,
  unchangedBooks:protectedNumbers,wordingChanges:changes,approvalRequired:true,
  productionSynced:false,illustrationsGenerated:0,pdfRegenerated:false,
  animalCharacters:'牛爷爷、牛奶奶、羊哥哥、羊妹妹、兔姐姐、兔弟弟和小马均为童话伙伴，不增改用户真实家庭成员。',
  layout:'paragraphs是阅读分段，不是已完成的A5页码。',books};
const method={scope:'只统计当前30篇正文；不含书名、姓名CHILD、提示、生字栏、历史版本和个性化家庭变体。',
  recurrence:'原200字每字至少进入3篇不同故事，作为本次编辑检查线；总次数另列，不把同篇重复当作跨篇复现，不代表识字掌握保证。',
  words:'固定完整词及常用搭配索引，逐段按连续原文匹配；不跨标点或段落拼词，不把各索引相加当作词总量。',
  phonetics:'长的cháng/zhǎng等不同读音不视为同一个读音已复现；火在本稿中主要通过火车出现，不代表掌握所有义项。',
  variants:'统计样本为五岁、大班、爸爸妈妈孩子三口。年龄、班级、家庭变体需独立重算。'};
const audit={date:'2026-10-26',method,before,current,perBook,targetRows,auxiliaryRows,wordRows,
  auxiliaryAdded:current.auxiliary.filter(c=>!before.auxiliary.includes(c)),auxiliaryRemoved:before.auxiliary.filter(c=>!current.auxiliary.includes(c)),
  inputHashes:{baseline:hash(path.join(baseline,`${file}.json`)),characterPlan:planHash,edits:hash(path.join(__dirname,'level1-implemented-texts-20261026.cjs'))}};
const txt=[manuscript.title,'2026-10-26｜待用户确认｜未出图、未同步阅读应用及PDF',
  '【孩子名字】为替换位置，不计入字频。第1、2篇沿用父母领读方案。动物长辈及兄弟姐妹是童话伙伴，不是给用户增设家庭成员。',
  ...books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n');
const table=rows=>rows.map(r=>`${r.term}\t${r.totalOccurrences}\t${r.distinctStories}\t${r.storyNumbers.join('、')}`).join('\n');
const write=(name,content)=>fs.writeFileSync(path.join(out,name),typeof content==='string'?content:JSON.stringify(content,null,2)+'\n','utf8');
write(`${file}.json`,manuscript); write(`${file}.txt`,txt+'\n'); write('覆盖与复现统计.json',audit);
write('200字逐字复现明细.txt','字\t正文总次数\t覆盖篇数\t新篇号\n'+table(targetRows)+'\n\n字表外用字\n'+table(auxiliaryRows)+'\n');
write('完整词语复现明细.txt',method.words+'\n词或搭配\t正文总次数\t覆盖篇数\t新篇号\n'+table(wordRows)+'\n');
write('逐篇新字与新旧篇号对照.txt','新增仅表示此前正文未出现，不表示此前出现过的字已掌握。姓名、书名不计。\n'+perBook.map(b=>`\n新${b.number}《${display(b.title)}》｜原${b.oldNumber}｜本轮前题《${display(b.previousTitle)}》\n正文${b.hanOccurrences}字，${b.paragraphs}段；首次出现${b.newCharacters.length}字：${b.newCharacters.join('、')||'无'}\n其中原200表内：${b.newTargetCharacters.join('、')||'无'}；表外：${b.newAuxiliaryCharacters.join('、')||'无'}`).join('\n')+'\n');
const report=[
  '第一级30篇：正文覆盖与复现核查｜2026-10-26',
  ...Object.values(method),
  `原稿→本稿：正文总字次 ${before.totalHanOccurrences}→${current.totalHanOccurrences}；不同汉字 ${before.uniqueHan}→${current.uniqueHan}；原200字覆盖 ${before.coveredTargets}→${current.coveredTargets}。`,
  `原200字跨篇复现：缺字 ${before.missing.length}→0；仅1篇 ${before.targetOneStory}→0；仅2篇 ${before.targetTwoStories}→0；至少3篇 ${before.targetAtLeastThreeStories}→200。`,
  `总次数仍需区别：仅3次${current.targetTotalThree.length}字，仅4次${current.targetTotalFour.length}字，至少5次${current.targetTotalAtLeastFive}字。达到3篇编辑线不等于巩固已充分。`,
  `仅3次：${current.targetTotalThree.join('、')}。`, `仅4次：${current.targetTotalFour.join('、')}。`,
  `字表外${current.auxiliary.length}字：${current.auxiliary.join('、')}。这些服务于正常词语和情节，未改成截断词来避字。`,
  `本轮新增表外字：${audit.auxiliaryAdded.join('、')}；不再使用：${audit.auxiliaryRemoved.join('、')}。`,
  `正文长度：${Math.min(...perBook.map(b=>b.hanOccurrences))}—${Math.max(...perBook.map(b=>b.hanOccurrences))}字；均值${(current.totalHanOccurrences/30).toFixed(1)}。第23篇${perBook[22].hanOccurrences}字、6段。`,
  '复现间隔并非均匀：各字首次、下一次及最大篇号间隔详见JSON；尤其开篇数字与班级等后续复现在中后段。保留前两篇领读方案，不据总频次声称每个孩子均能独读。',
  '完整词另列，不把单字达标说成每个词都达标。例如入口、出口、躲等情节用词仍属低频。',
  '长：长短的长在第13、23、27、29篇；生长的长在第20篇，读音分别统计理解。',
  '叙事复查：第8篇为把草看成虫；第16篇脚从大雨鞋中出来后换小鞋；第17篇姐姐也去洗手；第23篇憋笑游戏；第25篇等太阳的孩子反而睡着；第26篇水动令倒影消失；第29篇因纸不够大换纸。',
  '第1、2、3、5、6、7篇与本轮基线逐字一致。其余24篇为本轮审稿变更，完整前后对照存入文案JSON。',
  '牛、羊、兔等家庭角色均为童话伙伴。插画、阅读应用、PDF未同步，等待文案确认。'
].join('\n');
write('覆盖与复现统计报告.txt',report+'\n');
write('校验结果.json',{passed:true,checks:['30篇及原篇号唯一','原200字表未修改','200字全部进入至少3篇正文','独立逐字计数一致','第1、2、3、5、6、7篇原样保留','第3篇无已删除数数台词','第23篇保持6段'],summary:current});
// 审稿入口更新；保留基线及历史报表，不写入生产正文或插画资产。
fs.copyFileSync(path.join(out,`${file}.json`),path.join(canonical,`${file}.json`));
fs.copyFileSync(path.join(out,`${file}.txt`),path.join(canonical,`${file}.txt`));
fs.writeFileSync(path.join(canonical,'本次修订说明-20261026.txt'),
  '当前完整文案已更新为2026-10-26待确认稿。其他2026-10-25报告及此前未带日期的生字/原稿保留报告是历史结果，不适用于本稿。\n最新统计目录：'+out+'\n本轮前完整稿备份：'+baseline+'\n尚未同步阅读应用、绘本图或PDF。\n','utf8');
console.log(JSON.stringify({out,before,current,changed:changes.map(b=>b.number),
  exampleWords:wordRows.filter(r=>['朋友','耳朵','眼睛','米饭','洗手','生日','面包','自己','入口','出口'].includes(r.term)).map(({term,totalOccurrences,distinctStories})=>({term,totalOccurrences,distinctStories})),
  newCounts:perBook.map(b=>[b.number,b.newCharacters.length])},null,2));
