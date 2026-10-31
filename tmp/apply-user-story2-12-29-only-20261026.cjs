'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'output/manuscript-level1-complete-review');
const name='第一级30篇完整文案-待确认';
const source=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
assert.equal(source.books.length,30);
const next=JSON.parse(JSON.stringify(source));
const history=path.join(dir,'history/before-user-story2-12-29-wording-20261026');
fs.mkdirSync(history,{recursive:true});
for(const ext of ['json','txt']){
 const dest=path.join(history,name+'.'+ext);
 if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,name+'.'+ext),dest);
}
const edits={
 2:{title:'下雪了',paragraphs:['下雪了！','一片两片三四片，','五片六片七八片，','九片十片十一片，','飞入草丛都不见。'],reason:'完全采用用户指定的下雪场景，量词诗四行逐字保留。'},
 12:{title:'水中的我',paragraphs:['水中有天，有云，也有我。','我笑，水中的我也笑。','我走，水中的我也走。','我不走，水中的我也不走。','“你好，水中的我！”'],reason:'完全采用用户给定正文，只写镜像跟随，删除触水和倒影消失后恢复的支线。'},
 29:{title:'小火车',paragraphs:['我给小火车画条路。','路太小，火车过不去。','我再画条大大的路。','这回，火车开过去了！','我还画上绿树和红花。','“小火车，开走吧！”'],reason:'完全采用用户给定标题和正文，将画家改为画路，不另改字词。'}
};
const ids=[2,12,29];
for(const n of ids){const e=edits[n];next.books[n-1]={...next.books[n-1],title:e.title,paragraphs:e.paragraphs,
 orderingReason:e.reason,status:n===2?'user-confirmed-parent-led':'user-specified-text',userDecision:'apply-exact-user-wording-20261026'};}
for(let i=0;i<30;i++)if(!ids.includes(i+1))assert.deepEqual(next.books[i],source.books[i],`第${i+1}篇越界修改`);
assert.deepEqual(next.books[1].paragraphs.slice(1),source.books[1].paragraphs.slice(-4));
const cumulative=[...new Set([...(source.revision.cumulativeUserChanges||[]),...ids])].sort((a,b)=>a-b);
next.revision={date:'2026-10-26',scope:ids,cumulativeUserChanges:cumulative,basis:'本次仅按用户给定标题和正文修改第2、12、29篇，其余27篇逐字不变。',productionSynced:false};
next.firstTwoPreserved=false;
next.approval.confirmedBooks=[...new Set([...(next.approval.confirmedBooks||[]),...ids])].sort((a,b)=>a-b);
next.approval.history.push({date:'2026-10-26',decision:'第2篇改下雪了并保留量词诗，第12篇只写镜像跟随，第29篇改画路及标题小火车；均完全采用用户给定文字。其余27篇不变，未出图。'});
next.wordingChanges.push(...ids.map(n=>({date:'2026-10-26',number:n,oldNumber:source.books[n-1].oldNumber,beforeTitle:source.books[n-1].title,afterTitle:edits[n].title,before:source.books[n-1].paragraphs,after:edits[n].paragraphs,source:'user-provided-full-text'})));
next.draftOnlyChanges=[...new Set([...(next.draftOnlyChanges||[]),...ids])];
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const txt=['第一级30篇完整文案｜恢复稿基础上按用户要求修改第'+cumulative.join('、')+'篇',
 '2026-10-26｜本次仅按用户给定全文修改第2、12、29篇，其余27篇保持原样。未出图、未同步应用或PDF。',
 ...next.books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n';
fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(next,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,name+'.txt'),txt,'utf8');
const saved=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const changed=saved.books.filter((b,i)=>JSON.stringify(b)!==JSON.stringify(source.books[i])).map(b=>b.number);
assert.deepEqual(changed,ids);
for(const n of ids){assert.equal(saved.books[n-1].title,edits[n].title);assert.deepEqual(saved.books[n-1].paragraphs,edits[n].paragraphs);}
fs.writeFileSync(path.join(dir,'第2、12、29篇-用户指定稿-20261026.txt'),ids.flatMap(n=>[`${n}.《${edits[n].title}》`,...edits[n].paragraphs,'']).join('\n')+'\n','utf8');
const recordPath=path.join(dir,'当前版本与撤回记录-20261026.json');
const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));
record.status='restored-with-user-specified-stories-'+cumulative.join('-');record.userAuthorizedChanges=cumulative;record.latestChangedStories=ids;
record.currentSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name+'.json'))).digest('hex');
record.productionChanged=false;record.illustrationsGenerated=0;
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,'本次修订说明-20261026.txt'),[
 '当前稿：恢复稿基础上，按用户明确要求修改第'+cumulative.join('、')+'篇。',
 '本次只修改第2、12、29篇：2改为下雪了且四行诗不变；12只保留镜像跟随；29改为画路和标题小火车。',
 '这三篇均逐字采用用户给定正文（仅统一中文引号），其余27篇完整书目对象与本次修改前相同。',
 '历史生字与词频报告不是当前统计。此前撤回的补字试排仍不得采用。',
 '本次未出图、未同步阅读应用或PDF。'
].join('\n')+'\n','utf8');
console.log(JSON.stringify({changedStories:changed,other27ExactlyUnchanged:true,poemPreserved:true,books:ids.map(n=>({number:n,title:saved.books[n-1].title,paragraphs:saved.books[n-1].paragraphs}))},null,2));
