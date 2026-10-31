'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../output/manuscript-level1-complete-review');
const read=name=>JSON.parse(fs.readFileSync(path.join(out,name),'utf8'));
const current=read('第一级30篇完整文案-待确认.json');
const before=read('history/before-story25-rewrite-20261025/第一级30篇完整文案-待确认.json');
const counts=read('逐篇用字与原稿保留检查.json');
const changed=current.books.filter(b=>{
  const prior=before.books.find(p=>p.oldNumber===b.oldNumber);
  return JSON.stringify([b.title,b.paragraphs])!==JSON.stringify([prior.title,prior.paragraphs]);
});
assert.deepEqual(changed.map(b=>b.number),[25]);
const book=changed[0],fresh=counts.perStory[24].newCharacters;
assert.equal(book.oldNumber,22);assert.equal(book.paragraphs.length,6);
assert.deepEqual(fresh,['日','黑','阳','坐']);
assert.deepEqual(counts.sourceChanges,[]);
const seen=new Set();
for(const b of current.books){const chars=[...new Set(b.paragraphs.join('').match(/\p{Script=Han}/gu)||[])];assert.deepEqual(chars.filter(c=>!seen.has(c)),counts.perStory[b.number-1].newCharacters);chars.forEach(c=>seen.add(c));}
assert.equal(current.books.length,30);assert.equal(seen.size,counts.defaultUniqueBodyCharacters);
const report={date:'2026-10-25',round:4,changedStories:[25],other29TextsPreserved:true,totalBooks:30,illustrationsGenerated:0,pdfRegenerated:false,productionSourcesChanged:[],book:{number:25,oldNumber:22,previousTitle:'看日出',title:book.title,paragraphs:book.paragraphs,newCharacters:fresh},review:'孩子天黑时跟爸爸等日出，先催太阳起床，坐着等时自己又睡着。日出后由爸爸的话揭晓，不把日出归因为呼喊。与第18篇爸爸未起床不同，本篇反转落在孩子身上。',futureArtNote:'末页表现孩子在爸爸身边坐着睡着；后续分镜可以用背影或姿态表达，不为真人头像生成闭眼等新表情。本轮不出图。'};
const text=['第25篇重写稿（2026-10-25）','原题看日出改为谁还在睡；原第22篇对应新第25篇，篇号不动，其余29篇题文不变。',`新增生字（${fresh.length}字）：${fresh.join('、')}`,`新第25篇《${book.title}》`,...book.paragraphs,'',report.review,'本轮只改文稿，未出图；完整30篇及全部生字统计已同步更新。'].join('\n');
for(const name of ['2026-10-25第25篇重写稿','2026-10-25逐篇复查与修改建议']){fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,name+'.txt'),text+'\n');}
console.log(JSON.stringify({changed:[25],other29Unchanged:true,title:book.title,newCharacters:fresh,paragraphs:book.paragraphs},null,2));
