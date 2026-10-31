'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'output/manuscript-level1-complete-review');
const name='第一级30篇完整文案-待确认';
const source=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const next=JSON.parse(JSON.stringify(source));
const history=path.join(dir,'history/before-story8-11-user-fixes-20261026');
fs.mkdirSync(history,{recursive:true});
for(const ext of ['json','txt']) {
 const saved=path.join(history,name+'.'+ext);
 if(!fs.existsSync(saved))fs.copyFileSync(path.join(dir,name+'.'+ext),saved);
}
next.books[7]={...next.books[7],title:'小虫在哪',paragraphs:[
 '石头上，有一只小虫。',
 '我走过去看。',
 '小虫不见了！',
 '“小虫，你在哪？”',
 '我低头一看，小虫在我的脚上！',
 '“你也要和我一起走吗？”'
],orderingReason:'孩子走近观察，找不到小虫，最后在自己的脚上发现；以位置揭晓形成趣味，撤掉虫与草的误认。',status:'awaiting-user-confirmation',userDecision:'rewrite-natural-insect-story-only-20261026'};
const ending='“明年我还要和小树比高高！”';
assert(!source.books[10].paragraphs.includes(ending),'已加过指定结尾，避免重复追加');
next.books[10]={...next.books[10],paragraphs:[...next.books[10].paragraphs,ending],userDecision:'append-exact-user-provided-ending-20261026'};
for(let i=0;i<30;i++)if(![7,10].includes(i))assert.deepEqual(next.books[i],source.books[i],`第${i+1}篇发生越界修改`);
assert.deepEqual(next.books[10].paragraphs.slice(0,-1),source.books[10].paragraphs);
assert.equal(next.books[10].paragraphs.at(-1),ending);
assert.deepEqual(next.books[19],source.books[19]);
next.revision={date:'2026-10-26',scope:[8,11],cumulativeUserChanges:[3,8,11],basis:'本次只重写第8篇，给第11篇追加用户指定结尾；第3篇及其他27篇与修改前完全一致。第20篇本次只核对来源，未修改。',productionSynced:false};
next.approval.history.push({date:'2026-10-26',decision:'按用户要求重写第8篇小虫故事；第11篇只加“明年我还要和小树比高高！”；其余28篇不动，未出图。'});
next.wordingChanges.push(...[8,11].map(n=>({date:'2026-10-26',number:n,oldNumber:next.books[n-1].oldNumber,beforeTitle:source.books[n-1].title,afterTitle:next.books[n-1].title,before:source.books[n-1].paragraphs,after:next.books[n-1].paragraphs,source:n===11?'user-provided-ending':'user-requested-rewrite'})));
next.draftOnlyChanges=[...new Set([...(next.draftOnlyChanges||[]),8,11])];
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const txt=['第一级30篇完整文案｜恢复稿基础上按用户要求修改第3、8、11篇',
 '2026-10-26｜本次仅改第8、11篇，其余28篇与修改前相同。未出图、未同步应用或PDF。',
 ...next.books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n';
fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(next,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,name+'.txt'),txt,'utf8');
const actual=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const changed=actual.books.filter((b,i)=>JSON.stringify(b)!==JSON.stringify(source.books[i])).map(b=>b.number);
assert.deepEqual(changed,[8,11]);
assert.deepEqual(actual.books[2],source.books[2]);assert.deepEqual(actual.books[19],source.books[19]);
const excerpt=[...actual.books.filter(b=>[8,11].includes(b.number)).flatMap(b=>[`${b.number}.《${b.title}》`,...b.paragraphs,''])].join('\n')+'\n';
fs.writeFileSync(path.join(dir,'第8与第11篇修订-20261026.txt'),excerpt,'utf8');
const recordPath=path.join(dir,'当前版本与撤回记录-20261026.json');
const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));
record.status='restored-with-user-specified-stories-3-8-11';record.userAuthorizedChanges=[3,8,11];record.latestChangedStories=[8,11];
record.currentSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name+'.json'))).digest('hex');
record.productionChanged=false;record.illustrationsGenerated=0;
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,'本次修订说明-20261026.txt'),[
 '当前文案：补字改稿前恢复稿，按用户明确要求修改第3、8、11篇。',
 '本次只改第8、11篇：8撤掉草虫误认，改为孩子在自己脚上找到小虫；11逐字保留原正文并追加指定的明年比高结尾。',
 '核对结果：除8、11外其余28篇的完整书目对象与本次修改前完全相同，包含已确认的第3篇。',
 '第20篇来源：2026-10-25第二轮，原结尾“我要去洗脚了”被替换为“我把水放好，不再加了。／我看看小脚，笑了。”；当时备注为不用擦、不突然洗脚，将湿脚当小意外。该结尾没有交代笑点，本次依照只改两篇的范围未改20。',
 '未采用撤回试排中的其他改写；未出图、未同步应用或PDF。历史字频和生字报表不是当前正文统计。'
].join('\n')+'\n','utf8');
console.log(JSON.stringify({changedStories:changed,other28ExactlyUnchanged:true,thirdPreserved:true,twentiethPreserved:true,books:actual.books.filter(b=>[8,11].includes(b.number)).map(({number,title,paragraphs})=>({number,title,paragraphs}))},null,2));
