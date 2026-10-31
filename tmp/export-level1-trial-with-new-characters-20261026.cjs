'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'output/level1-natural-story-plan-20261026');
const plan=JSON.parse(fs.readFileSync(path.join(out,'具体修改方案与试排核查.json'),'utf8'));
const canonical=path.join(root,'output/manuscript-level1-complete-review/第一级30篇完整文案-待确认.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const beforeHash=hash(canonical);
const target=new Set(plan.targetRows.map(r=>r.term));
const seen=new Set();
const han=s=>s.match(/\p{Script=Han}/gu)||[];
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const books=plan.perBook.map(b=>{
 const unique=[...new Set(han(b.proposed.join('')))];
 const fresh=unique.filter(c=>!seen.has(c));
 unique.forEach(c=>seen.add(c));
 assert.equal(han(b.proposed.join('')).length,b.proposedHan);
 return {number:b.number,oldNumber:b.oldNumber,title:display(b.proposedTitle),
 previousHan:b.previousHan,trialHan:b.proposedHan,newCharacters:fresh,
 newTargetCharacters:fresh.filter(c=>target.has(c)),newAuxiliaryCharacters:fresh.filter(c=>!target.has(c)),
 paragraphs:b.proposed.map(display)};
});
assert.equal(books.length,30);
assert.equal(books.reduce((s,b)=>s+b.newCharacters.length,0),238);
assert.equal(books.reduce((s,b)=>s+b.trialHan,0),1608);
assert.equal(books.reduce((s,b)=>s+b.previousHan,0),1700);
assert(books.every(b=>b.trialHan<=b.previousHan));
assert.equal(books.flatMap(b=>b.newTargetCharacters).length,200);
assert.equal(books.flatMap(b=>b.newAuxiliaryCharacters).length,38);
const note='新增生字＝按本次1—30篇顺序，正文第一次出现的不同汉字；包含原200字表外用字，表外字另列。不含书名、标点和孩子姓名。字数比较以试排前的孩子主角修订稿为基准。';
const txt=['第一级30篇试排文案｜逐篇新增生字与修改前后字数｜待审阅，未采用',note,
 '仍用五岁、大班、三口家庭的当前示例。仅导出原试排，不改正文、不出图。',
 ...books.flatMap(b=>['',`${b.number}.《${b.title}》｜原第${b.oldNumber}篇`,
 `字数：${b.previousHan}→${b.trialHan}字。新增生字（${b.newCharacters.length}）：${b.newCharacters.join('、')||'无'}。`,
 `其中字表外新增：${b.newAuxiliaryCharacters.join('、')||'无'}。`,...b.paragraphs])].join('\n')+'\n';
fs.writeFileSync(path.join(out,'完整30篇试排-逐篇生字与字数对照.txt'),txt,'utf8');
fs.writeFileSync(path.join(out,'逐篇新增生字与字数对照.json'),JSON.stringify({status:'proposal-not-applied',method:note,
 summary:{previousHan:1700,trialHan:1608,uniqueHan:238,targetCharacters:200,auxiliaryCharacters:38},books},null,2)+'\n','utf8');
assert.equal(hash(canonical),beforeHash);
console.log(JSON.stringify({canonicalUnchanged:true,books:books.map(({number,previousHan,trialHan,newCharacters,newAuxiliaryCharacters})=>({number,previousHan,trialHan,newCharacters:newCharacters.join('、'),outside:newAuxiliaryCharacters.join('、')}))},null,2));
