'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const prior=path.join(root,'output/level1-manuscript-implemented-20261026');
const out=path.join(root,'output/level1-child-centered-review-20261026');
const canonical=path.join(root,'output/manuscript-level1-complete-review');
const file='第一级30篇完整文案-待确认';
const source=read(path.join(prior,file+'.json'));
const earlier=read(path.join(prior,'baseline',file+'.json'));
const previousAudit=read(path.join(prior,'覆盖与复现统计.json'));
const edits=require('./level1-child-centered-texts-20261026.cjs');
const target=[...read(path.join(root,'little-protagonist/content/level1-character-plan.json')).characters];
const han=s=>s.match(/\p{Script=Han}/gu)||[];
const length=b=>han(b.paragraphs.join('')).length;
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const books=source.books.map(b=>({...b,...edits[b.number]}));
const numbers=Object.keys(edits).map(Number);
assert.equal(books.length,30);
assert.equal(new Set(books.map(b=>b.oldNumber)).size,30);
for(const n of [1,2,3,5,6,7]) assert.deepEqual(books[n-1],source.books[n-1]);
assert.deepEqual(books[2].paragraphs,earlier.books[2].paragraphs);
for(const n of numbers) {
  assert(length(books[n-1])<length(source.books[n-1]),`第${n}篇未缩短`);
  assert(books[n-1].paragraphs.some(p=>p.includes('我')),`第${n}篇缺孩子视角`);
}
assert(!/牛爷爷|牛奶奶|羊哥哥|羊妹妹|兔姐姐|兔弟弟|小马/.test(JSON.stringify(books)));
const unchanged=books.filter(b=>!numbers.includes(b.number)).map(b=>b.number);
for(const n of unchanged) assert.deepEqual(books[n-1],source.books[n-1]);
function row(term){
 const contexts=[];
 const perStory=books.map(b=>{let count=0;b.paragraphs.forEach((p,i)=>{const n=p.split(term).length-1;count+=n;if(n) contexts.push({story:b.number,paragraph:i+1,count:n,quote:p});});return {story:b.number,count};}).filter(r=>r.count);
 const ns=perStory.map(r=>r.story);
 return {term,totalOccurrences:perStory.reduce((a,r)=>a+r.count,0),distinctStories:ns.length,storyNumbers:ns,perStory,firstStory:ns[0]??null,nextStory:ns[1]??null,lastStory:ns.at(-1)??null,contexts};
}
const targetRows=target.map(row);
const chars=books.flatMap(b=>han(b.paragraphs.join('')));
const auxiliary=[...new Set(chars)].filter(c=>!target.includes(c));
const auxiliaryRows=auxiliary.map(row);
const wordRows=previousAudit.wordRows.map(r=>row(r.term));
const seen=new Set();
const perBook=books.map(b=>{const unique=[...new Set(han(b.paragraphs.join('')))];const fresh=unique.filter(c=>!seen.has(c));unique.forEach(c=>seen.add(c));return {number:b.number,oldNumber:b.oldNumber,title:b.title,hanOccurrences:length(b),previousHanOccurrences:length(source.books[b.number-1]),paragraphs:b.paragraphs.length,newCharacters:fresh,newTargetCharacters:fresh.filter(c=>target.includes(c)),newAuxiliaryCharacters:fresh.filter(c=>!target.includes(c))};});
const current={stories:30,totalHanOccurrences:chars.length,uniqueHan:new Set(chars).size,targetCount:200,coveredTargets:targetRows.filter(r=>r.totalOccurrences).length,missing:targetRows.filter(r=>!r.totalOccurrences).map(r=>r.term),targetOneStory:targetRows.filter(r=>r.distinctStories===1).length,targetTwoStories:targetRows.filter(r=>r.distinctStories===2).length,targetAtLeastThreeStories:targetRows.filter(r=>r.distinctStories>=3).length,auxiliary};
const changes=numbers.map(n=>({number:n,oldNumber:books[n-1].oldNumber,beforeTitle:source.books[n-1].title,afterTitle:books[n-1].title,before:source.books[n-1].paragraphs,after:books[n-1].paragraphs,beforeHan:length(source.books[n-1]),afterHan:length(books[n-1])}));
const manuscript={title:'第一级30篇完整文案·孩子主角修订待确认稿',date:'2026-10-26',revision:'child-centered-r2',status:'text-draft-awaiting-user-review',
 basis:'按用户意见撤掉为补字加入的动物亲属及拟人小马设定，孩子主导行动；同步删掉无关补字枝节。自然、简短优先，覆盖不足如实保留待后续编排，不宣称原200字全部达标。',
 numbering:source.numbering,example:source.example,parentLedOpening:source.parentLedOpening,
 characterPolicy:'使用既有爸爸妈妈、普通朋友与不说话的小猫小狗小兔；不增设家人，不将动物设为孩子的长辈、兄弟姐妹或同学。',
 unchangedBooks:unchanged,wordingChanges:changes,thirdStoryCheck:{unchangedThisRound:true,unchangedPreviousRound:true,paragraphs:books[2].paragraphs,explanation:'更早按用户要求删除数数及惊叹旁白；本轮和上一轮均未改动这六句话。'},
 approvalRequired:true,productionSynced:false,illustrationsGenerated:0,pdfRegenerated:false,layout:source.layout,books};
const audit={date:'2026-10-26',revision:'child-centered-r2',method:previousAudit.method,before:previousAudit.current,current,perBook,targetRows,auxiliaryRows,wordRows,
 auxiliaryAdded:auxiliary.filter(c=>!previousAudit.current.auxiliary.includes(c)),
 inputHashes:{previousManuscript:crypto.createHash('sha256').update(fs.readFileSync(path.join(prior,file+'.json'))).digest('hex')},
 status:'原200字覆盖及三篇复现未全部满足；不以加角色、加句子强补。'};
const table=rows=>rows.map(r=>`${r.term}\t${r.totalOccurrences}\t${r.distinctStories}\t${r.storyNumbers.join('、')}`).join('\n');
fs.mkdirSync(out,{recursive:true});
const write=(name,v)=>fs.writeFileSync(path.join(out,name),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n','utf8');
const txt=[manuscript.title,'2026-10-26｜撤去动物亲属设定｜待确认，未出图、未同步应用或PDF',
 '【孩子名字】为姓名替换位置。前两篇保持父母领读定位。',
 ...books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n';
write(file+'.json',manuscript);write(file+'.txt',txt);write('覆盖与复现统计.json',audit);
write('200字逐字复现明细.txt','字\t总次数\t篇数\t新篇号\n'+table(targetRows)+'\n\n表外字\n'+table(auxiliaryRows)+'\n');
write('完整词语复现明细.txt',previousAudit.method.words+'\n词语\t总次数\t篇数\t新篇号\n'+table(wordRows)+'\n');
write('逐篇新字与新旧篇号对照.txt','新字是正文首次出现，不等于其余字已掌握。姓名与标题不计。\n'+perBook.map(b=>`\n新${b.number}《${display(b.title)}》｜原${b.oldNumber}\n正文${b.hanOccurrences}字（上轮${b.previousHanOccurrences}字）\n首次出现：${b.newCharacters.join('、')||'无'}\n表内：${b.newTargetCharacters.join('、')||'无'}；表外：${b.newAuxiliaryCharacters.join('、')||'无'}`).join('\n')+'\n');
write('本轮修改篇目完整文案.txt',changes.flatMap(c=>[`${c.number}.《${c.afterTitle}》｜${c.beforeHan}→${c.afterHan}字`,...c.after,'']).join('\n'));
write('修订与统计说明.txt',[
 '孩子主角修订稿｜2026-10-26',
 `本轮修改${numbers.length}篇：${numbers.join('、')}。其余篇目与上一轮逐字一致。`,
 '撤去牛爷爷、牛奶奶、羊哥哥、羊妹妹、兔姐姐、兔弟弟及拟人小马。保留作为观察、游戏对象的普通小动物。',
 '第13篇删耳朵比较等旁枝；第15篇改为孩子从嫌饭多到还想吃的小转折；第17篇由孩子提醒妈妈也洗手；第20篇由孩子种豆、等待、发现新苗；第21篇孩子藏、妈妈找；第24篇恢复孩子分果子；第29篇由孩子画礼物；第30篇去掉无关吃水果情节。',
 '第3篇上轮及本轮均未改。更早按用户要求删去“我来数一数”“我数好了”“咦”等，不再增加数数旁白。三口家庭仅为示例，生产系统仍按真实家庭配置。',
 `本轮改动的每一篇都比上一轮短。总字次2224→${current.totalHanOccurrences}，减少${2224-current.totalHanOccurrences}字。`,
 `原200字实际覆盖${current.coveredTargets}字；缺${current.missing.length}字：${current.missing.join('、')}。`,
 `跨篇复现：只1篇${current.targetOneStory}字，只2篇${current.targetTwoStories}字，至少3篇${current.targetAtLeastThreeStories}字。此前“200字各至少3篇”的统计仅适用于已撤回的角色扩充稿。`,
 `正文不同汉字${current.uniqueHan}个，其中表外${auxiliary.length}个：${auxiliary.join('、')}。本轮新引入表外：${audit.auxiliaryAdded.join('、')||'无'}。`,
 '字表保持200字，未缩减目标。未完成的覆盖与复现记为编排缺口，不为达到数字另加人物或无关句子。',
 '仍为文案待确认稿。未出图、未生成PDF、未更新阅读应用。'
].join('\n')+'\n');
write('校验结果.json',{passed:true,scope:'文件及修订约束校验，不表示200字教学覆盖达标',checks:['30篇编号及原篇号唯一','16篇均缩短','其余14篇原样保留','第3篇与本轮前及上轮前一致','无动物亲属或小马设定','每篇修订保留第一人称孩子视角'],current});
for(const ext of ['json','txt']) fs.copyFileSync(path.join(out,file+'.'+ext),path.join(canonical,file+'.'+ext));
fs.writeFileSync(path.join(canonical,'本次修订说明-20261026.txt'),'最新待确认稿为孩子主角修订稿，撤去动物亲属与拟人小马设定。\n最新完整稿及统计：'+out+'\n上一轮200字全部覆盖的统计已不适用于本稿；该轮文稿仍保留在：'+prior+'\n本轮未出图或同步生产。\n','utf8');
console.log(JSON.stringify({out,current,changes:changes.map(c=>({number:c.number,before:c.beforeHan,after:c.afterHan})),thirdStoryUnchanged:true},null,2));
