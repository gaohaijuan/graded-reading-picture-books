'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'output/manuscript-level1-complete-review');
const name='第一级30篇完整文案-待确认';
const source=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
assert.equal(source.books.length,30);
const next=JSON.parse(JSON.stringify(source));
const history=path.join(dir,'history/before-user-story19-25-wording-20261026');
fs.mkdirSync(history,{recursive:true});
for(const ext of ['json','txt']){
 const backup=path.join(history,name+'.'+ext);
 if(!fs.existsSync(backup))fs.copyFileSync(path.join(dir,name+'.'+ext),backup);
}
const edits={
 19:['我想喝水。','这水太热了，我还不能喝。','我把水放一放，等一等。','水不热了！','我能喝了。','我喝一口，再喝一口。','真好喝！'],
 25:['我和爸爸来看日出。','天还黑着。','“太阳，我都起来了，你还不起来吗？”','我坐下来，等一等。等着等着，我睡着了。','“快看，太阳出来了！”爸爸叫我。','我一看，天边红红的。爸爸笑着说：“太阳起来了，你还在睡呢！”']
};
for(const n of [19,25])next.books[n-1]={...next.books[n-1],paragraphs:edits[n],status:'user-specified-text',
 userDecision:'apply-exact-user-wording-20261026',orderingReason:n===19?'完全采用用户文字：放一放、等一等，删去这回，补上真好喝。':'完全采用用户文字：明确孩子等着等着睡着，爸爸叫醒后看到日出，以还在睡呢收尾。'};
for(let i=0;i<30;i++)if(![18,24].includes(i))assert.deepEqual(next.books[i],source.books[i],`第${i+1}篇发生越界改动`);
next.revision={date:'2026-10-26',scope:[19,25],cumulativeUserChanges:[3,8,11,19,20,25],basis:'本次仅按用户给出的文字修改第19、25篇，整理引号和句末标点；其余28篇完全不变。',productionSynced:false};
next.approval.confirmedBooks=[...new Set([...(next.approval.confirmedBooks||[]),19,25])].sort((a,b)=>a-b);
next.approval.history.push({date:'2026-10-26',decision:'第19、25篇采用用户指定全文，其他28篇不动，未出图。'});
next.wordingChanges.push(...[19,25].map(n=>({date:'2026-10-26',number:n,oldNumber:next.books[n-1].oldNumber,
 beforeTitle:source.books[n-1].title,afterTitle:next.books[n-1].title,before:source.books[n-1].paragraphs,after:edits[n],source:'user-provided-full-text'})));
next.draftOnlyChanges=[...new Set([...(next.draftOnlyChanges||[]),19,25])];
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const txt=['第一级30篇完整文案｜恢复稿基础上按用户要求修改第3、8、11、19、20、25篇',
 '2026-10-26｜本次仅按用户给定全文修改第19、25篇，其余28篇保持原样。未出图、未同步应用或PDF。',
 ...next.books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n';
fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(next,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,name+'.txt'),txt,'utf8');
const saved=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const changed=saved.books.filter((b,i)=>JSON.stringify(b)!==JSON.stringify(source.books[i])).map(b=>b.number);
assert.deepEqual(changed,[19,25]);
for(const n of [19,25])assert.deepEqual(saved.books[n-1].paragraphs,edits[n]);
fs.writeFileSync(path.join(dir,'第19与第25篇-用户指定稿-20261026.txt'),[19,25].flatMap(n=>[`${n}.《${saved.books[n-1].title}》`,...edits[n],'']).join('\n')+'\n','utf8');
const recordPath=path.join(dir,'当前版本与撤回记录-20261026.json');
const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));
record.status='restored-with-user-specified-stories-3-8-11-19-20-25';record.userAuthorizedChanges=[3,8,11,19,20,25];record.latestChangedStories=[19,25];
record.currentSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name+'.json'))).digest('hex');
record.productionChanged=false;record.illustrationsGenerated=0;
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,'本次修订说明-20261026.txt'),[
 '当前稿：恢复稿基础上，按用户要求修改第3、8、11、19、20、25篇。',
 '本次第19篇全文采用用户给定文字：放一放；删除这回；拆开水不热了、我能喝了；补真好喝。',
 '本次第25篇全文采用用户给定文字：等着等着睡着；爸爸叫醒；红红的天边；结尾还在睡呢。',
 '核对结果：其他28篇完整书目对象均与本次修改前一致。',
 '本次未出图、未同步阅读应用或PDF；此前撤回的补字改稿与试排仍不得采用，历史词频报表不代表当前稿。'
].join('\n')+'\n','utf8');
console.log(JSON.stringify({changedStories:changed,other28ExactlyUnchanged:true,books:[19,25].map(n=>({number:n,title:saved.books[n-1].title,paragraphs:edits[n]}))},null,2));
