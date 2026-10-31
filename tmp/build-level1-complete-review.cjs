'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const workspace=path.resolve(__dirname,'..');
const root=path.join(workspace,'little-protagonist');
const {listBooks}=require(path.join(root,'miniprogram/lib/stories'));
const {defaultMembers}=require(path.join(root,'miniprogram/lib/family'));
const {uniqueHan}=require(path.join(root,'miniprogram/lib/literacy'));
const source=listBooks({name:'CHILD',age:5,className:'大班'},defaultMembers(),{includeApproved:true});
const inputs=['miniprogram/lib/stories.js','miniprogram/lib/family.js','miniprogram/lib/level1-approved.js','content/level1-stories-04-10.json','content/level1-stories-11-20.json','content/level1-stories-21-40.json','content/level1-character-plan.json'];
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const before=inputs.map(file=>({file,sha256:hash(file)}));
const firstThree=source.slice(0,3).map((b,i)=>({number:i+1,title:b.title,paragraphs:b.pages.map(p=>p.join(''))}));
const originals=[...firstThree,...require('./level1-complete-review-texts.cjs')];
const order=require('./level1-reading-order.cjs');
assert.deepEqual(order.map(b=>b.oldNumber).sort((a,b)=>a-b),Array.from({length:30},(_,i)=>i+1));
const books=order.map((entry,i)=>{
  const b=originals.find(item=>item.number===entry.oldNumber);
  assert.ok(b);
  return {...b,number:i+1,oldNumber:entry.oldNumber,stage:entry.stage,orderingReason:entry.reason,
    status:i<2?'user-confirmed-parent-led':'awaiting-user-confirmation',userDecision:i<2?'retain-existing-text':null};
});
assert.deepEqual(books.map(b=>b.number),Array.from({length:30},(_,i)=>i+1));
assert.equal(books[7].oldNumber,27);
assert.deepEqual(books.slice(0,3).map(b=>b.paragraphs),source.slice(0,3).map(b=>b.pages.map(p=>p.join(''))));
const working=new Set(JSON.parse(fs.readFileSync(path.join(root,'content/level1-character-plan.json'),'utf8')).characters);
const seen=new Set(),outside=new Set();
const rows=books.map(book=>{
  const text=book.paragraphs.join('');
  assert.equal((text.match(/“/g)||[]).length,(text.match(/”/g)||[]).length,book.number+': unmatched quotation marks');
  const chars=uniqueHan(text),fresh=chars.filter(c=>!seen.has(c));
  chars.forEach(c=>{seen.add(c);if(!working.has(c))outside.add(c);});
  const titleOnly=uniqueHan(book.title).filter(c=>!seen.has(c));
  assert.deepEqual(titleOnly,[],book.number+': title adds an unintroduced character');
  return {number:book.number,oldNumber:book.oldNumber,title:book.title,characters:chars.length,newCharacters:fresh,newCount:fresh.length,cumulative:seen.size,outsideWorkingList:chars.filter(c=>!working.has(c))};
});
const out=path.join(workspace,'output/manuscript-level1-complete-review');fs.mkdirSync(out,{recursive:true});
const canonical='第一级30篇完整文案-待确认.json';
let previous=null;
if(fs.existsSync(path.join(out,canonical))){
  previous=JSON.parse(fs.readFileSync(path.join(out,canonical),'utf8'));
  if(!previous.books[0].oldNumber){
    const backup=path.join(out,'history/before-reading-order-20261025');
    fs.mkdirSync(backup,{recursive:true});
    for(const name of [canonical,'第一级30篇完整文案-待确认.txt','逐篇用字与原稿保留检查.json']){
      const dest=path.join(backup,name);
      if(!fs.existsSync(dest))fs.copyFileSync(path.join(out,name),dest,fs.constants.COPYFILE_EXCL);
    }
  }
}
const priorPath=path.join(out,'history/before-reading-order-20261025',canonical);
if(fs.existsSync(priorPath))previous=JSON.parse(fs.readFileSync(priorPath,'utf8'));
const correctionBaseline=JSON.parse(fs.readFileSync(path.join(out,'history/before-story25-rewrite-20261025',canonical),'utf8'));
assert.deepEqual(books.slice(0,2).map(b=>b.paragraphs),correctionBaseline.books.slice(0,2).map(b=>b.paragraphs));
for(const oldNumber of [5,6,7])assert.deepEqual(books.find(b=>b.oldNumber===oldNumber).paragraphs,correctionBaseline.books.find(b=>b.oldNumber===oldNumber).paragraphs);
assert.deepEqual(books.slice(4,7).map(b=>b.oldNumber),[7,5,6]);
assert.doesNotMatch(books[2].paragraphs.join(''),/数|咦|忘/);
const wordingChanges=books.flatMap(b=>{
  const prior=correctionBaseline.books.find(p=>p.oldNumber===b.oldNumber);
  return prior.title===b.title&&JSON.stringify(prior.paragraphs)===JSON.stringify(b.paragraphs)?[]:[{number:b.number,oldNumber:b.oldNumber,beforeTitle:prior.title,afterTitle:b.title,before:prior.paragraphs,after:b.paragraphs}];
});
const correctedNumbers=[25];
assert.deepEqual(wordingChanges.map(b=>b.number),correctedNumbers);
for(const b of books.filter(b=>!correctedNumbers.includes(b.number))){
  const prior=correctionBaseline.books.find(p=>p.oldNumber===b.oldNumber);
  assert.deepEqual([b.title,b.paragraphs],[prior.title,prior.paragraphs]);
}
for(const n of correctedNumbers){
  const b=books[n-1];b.previousTitle=correctionBaseline.books[n-1].title;
  assert.equal(b.paragraphs.length,6);
}
assert.equal(working.has('擦'),false);
assert.doesNotMatch(books[19].paragraphs.join(''),/擦|洗脚/);
assert.equal(books[22].paragraphs.length,6);
const manuscript={title:'第一级30篇完整文案·待确认稿',status:'text-draft-awaiting-user-review',
  basis:'以当前书架旧序1—20及同序后续21—30原稿为基础，合入用户逐条指出的问题；未使用已撤回的v9。',
  numbering:'序号保持：原第7篇→新第5篇，原第5篇→新第6篇，原第6篇→新第7篇；原第27篇→新第8篇（现题小虫不走），原第26篇→新第23篇（现题谁先笑）。oldNumber始终指最初篇号。',
  example:{name:'小石头',age:5,className:'大班',family:['爸爸','妈妈','孩子']},
  firstTwoPreserved:true,thirdStorySimplified:true,illustrationsGenerated:0,shelfReplaced:false,pdfRegenerated:false,
  productionChanges:['第3篇动态家庭正文已同步阅读及后续打印数据源','已完成绘本第5—7篇仅换序，正文和插画资源未改'],
  draftOnlyChanges:correctedNumbers,
  parentLedOpening:{numbers:[1,2],decision:'用户明确确认保留，分级阅读开篇由父母领读；不按独读要求评判或建议改写。'},
  layout:'paragraphs仅为阅读分段，不是固定A5页码。',approval:{confirmedBooks:[1,2],history:[{date:'2026-10-25',decision:'保留第1、2篇原稿与此前修订；本轮按用户意见重写第25篇，原题看日出改为谁还在睡，尚待用户审阅。'}]},wordingChanges,books};
fs.writeFileSync(path.join(out,'第一级30篇完整文案-待确认.json'),JSON.stringify(manuscript,null,2)+'\n');
const display=s=>s.replaceAll('CHILD','小石头');
const lines=['第一级30篇完整文案（重排待确认稿）','2026-10-25第4轮：只重写新第25篇，原题看日出改为谁还在睡，正文6段；其他29篇题文不动。','新第25篇对应原第22篇；此前新第8篇《小虫不走》和新第23篇《谁先笑》等修订保留。原篇号指最初30篇编号。','新增生字指本篇正文中首次出现、此前正文未出现的汉字；不计标题、标点和个性化人名，按首次出现顺序列出。','第1、2篇按父母领读定位，不因首次出现字数再次建议改写。示例为小石头、五岁、大班及三口家庭。','出现字不等于孩子已经掌握；不为卡每篇字数而截断正常词语。','第3篇和已完成绘本的第5—7篇次序此前已同步到了阅读及后续打印数据源；本轮仅修订文稿，待确认后再按画面对应情况同步绘本。本次没有出图或重新导出PDF。',''];
lines.push('新旧篇号与新增生字对照');
for(const r of rows)lines.push(`新${r.number}｜原${r.oldNumber}｜《${display(r.title)}》｜新增${r.newCount}字：${r.newCharacters.join('、')||'无'}`);
lines.push('','全文');
for(const b of books){const r=rows[b.number-1];lines.push(`第${b.number}篇《${display(b.title)}》（原第${b.oldNumber}篇）`,`新增生字（${r.newCount}字）：${r.newCharacters.join('、')||'无'}`,...b.paragraphs.map(display),'');}
fs.writeFileSync(path.join(out,'第一级30篇完整文案-待确认.txt'),lines.join('\n'));
const rationale=['30篇排序与用字递进说明','本轮只换新第25篇（原第22篇）题文，由看日出改为谁还在睡；其他29篇题文、全部篇号顺序不动。','排序综合动作是否直接可见、单步或多步、观察推理、双人对话与字词复现；新增字数不是唯一排序标准。','第1、2篇用户明确确认保留，作为父母领读的开篇，不按独读要求再提改写。第3篇简化稿保留。','生字仅按正文首次接触统计，不包括标题和个性化人名。完整词语保留，不为卡字量截断。',''];
for(const b of books){const r=rows[b.number-1];rationale.push(`新${b.number}／原${b.oldNumber}《${display(b.title)}》`,`阶段：${b.stage}`,b.orderingReason,`新增${r.newCount}字：${r.newCharacters.join('、')||'无'}；累计${r.cumulative}字。`,'');}
rationale.push('本轮句子修正（对应上一轮已按用户意见修订的稿件）');
for(const change of wordingChanges)rationale.push(`新${change.number}／原${change.oldNumber}：${change.beforeTitle} → ${change.afterTitle}`,`修改前：${change.before.join('／')}`,`修改后：${change.after.join('／')}`,'');
fs.writeFileSync(path.join(out,'30篇新旧篇号与生字递进说明.txt'),rationale.join('\n'));
const changed=before.filter(r=>hash(r.file)!==r.sha256);assert.deepEqual(changed,[]);
const checks={stories:books.length,firstTwoUnchanged:true,parentLedOpeningConfirmed:[1,2],thirdMatchesActualFamilyBook:true,original27IsNew8:books[7].oldNumber===27,earlyOrder:[7,5,6],earlyStoryTextsUnchanged:true,correctedStories:correctedNumbers,workingListIncludesCa:false,story20UsesCa:false,story23Paragraphs:6,maxNewCharactersAfterOpening:Math.max(...rows.slice(3).map(r=>r.newCount)),pendingTextReview:books.filter(b=>b.userDecision===null).map(b=>b.number),
  defaultUniqueBodyCharacters:seen.size,outsideWorkingCharacterList:[...outside],perStory:rows,
  note:'统计仅为当前默认正文的字形接触量；不能据此声称已符合正式教学验收或孩子已掌握。正常词不得为卡字表而截断。',
  unchangedSources:before,sourceChanges:changed};
fs.writeFileSync(path.join(out,'逐篇用字与原稿保留检查.json'),JSON.stringify(checks,null,2)+'\n');
console.log(JSON.stringify({total:seen.size,outside:[...outside],perStory:rows.map(r=>({n:r.number,new:r.newCount,chars:r.newCharacters.join('')})),out},null,2));
