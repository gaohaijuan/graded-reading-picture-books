'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../output/manuscript-level1-complete-review');
const read=name=>JSON.parse(fs.readFileSync(path.join(out,name),'utf8'));
const current=read('第一级30篇完整文案-待确认.json');
const before=read('history/before-story8-23-rewrite-20261025/第一级30篇完整文案-待确认.json');
const counts=read('逐篇用字与原稿保留检查.json');
const edited=current.books.filter(b=>{
  const prior=before.books.find(p=>p.oldNumber===b.oldNumber);
  return JSON.stringify([prior.title,prior.paragraphs])!==JSON.stringify([b.title,b.paragraphs]);
});
assert.deepEqual(edited.map(b=>b.number),[8,23]);
assert.equal(current.books.length,30);
assert.equal(new Set(current.books.map(b=>b.oldNumber)).size,30);
assert.deepEqual(edited.map(b=>[b.number,b.oldNumber,b.paragraphs.length]),[[8,27,6],[23,26,6]]);
const seen=new Set();
for(const b of current.books){
  const han=[...new Set(b.paragraphs.join('').match(/\p{Script=Han}/gu)||[])];
  assert.deepEqual(han.filter(c=>!seen.has(c)),counts.perStory[b.number-1].newCharacters);
  han.forEach(c=>seen.add(c));
}
assert.equal(seen.size,counts.defaultUniqueBodyCharacters);
assert.doesNotMatch(current.books[22].paragraphs.join(''),/纸|路|长|短/);
assert.deepEqual(counts.sourceChanges,[]);
const notes={8:'孩子把石头上的小草误认成小虫，走近看清后笑了。后续画面必须始终是同一截卷曲草叶，表现观察揭晓，不是虫子变成草。',23:'父女或父子一起玩不许笑游戏，孩子把双手放在头上做兔耳动作，逗笑爸爸后自己也笑了。后续画面需把手势表现清楚；本轮不出图。'};
const report={date:'2026-10-25',round:3,changed:[8,23],other28TextsPreserved:true,firstTwoUnchanged:true,totalBooks:30,uniqueBodyCharacters:seen.size,illustrationsGenerated:0,productionSourcesChanged:[],books:edited.map(b=>({number:b.number,oldNumber:b.oldNumber,previousTitle:b.previousTitle,title:b.title,paragraphs:b.paragraphs,newCharacters:counts.perStory[b.number-1].newCharacters,reviewNote:notes[b.number]}))};
const lines=['第8篇与第23篇重写稿（2026-10-25）','只重写这两篇题文，其他28篇正文、篇号、既有绘本资源不变。第1、2篇按用户确认原稿保留。','第23篇撤去长短纸主题，改为亲子逗笑游戏；没有出图。',''];
for(const b of report.books)lines.push(`新第${b.number}篇《${b.title}》｜原第${b.oldNumber}篇（上一版题名：${b.previousTitle}）`,`新增生字（${b.newCharacters.length}字）：${b.newCharacters.join('、')}`,...b.paragraphs,`复查记录：${b.reviewNote}`,'');
lines.push('生字已按30篇当前顺序全部重新统计；例如兔提前到第23篇，画后移到第29篇。');
for(const basename of ['2026-10-25第8与第23篇重写稿','2026-10-25逐篇复查与修改建议']){
  fs.writeFileSync(path.join(out,basename+'.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,basename+'.txt'),lines.join('\n'));
}
console.log(JSON.stringify({changed:report.changed,other28TextsPreserved:true,totalBooks:30,uniqueBodyCharacters:seen.size,rewrites:report.books.map(b=>({number:b.number,title:b.title,newCharacters:b.newCharacters,paragraphs:b.paragraphs}))},null,2));
