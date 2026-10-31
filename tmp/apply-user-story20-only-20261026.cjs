'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'output/manuscript-level1-complete-review');
const name='第一级30篇完整文案-待确认';
const source=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const next=JSON.parse(JSON.stringify(source));
const history=path.join(dir,'history/before-story20-user-rewrite-20261026');
fs.mkdirSync(history,{recursive:true});
for(const ext of ['json','txt']){
 const dest=path.join(history,name+'.'+ext);
 if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,name+'.'+ext),dest);
}
const paragraphs=[
 '我拿小水壶，给小花喝水。',
 '一点，再一点。',
 '小虫爬到叶子下。',
 '“小虫，下雨啦！”',
 '我放好小水壶。',
 '小虫又爬出来了。',
 '“雨停啦！”'
];
next.books[19]={...next.books[19],paragraphs,
 orderingReason:'孩子拿水壶浇花，小虫到叶下避水；孩子把洒水当作小虫的小雨，放好水壶后，小虫又出来，以下雨、雨停的对应收尾。',
 status:'awaiting-user-confirmation',userDecision:'rewrite-watering-story-only-20261026'};
for(let i=0;i<30;i++)if(i!==19)assert.deepEqual(next.books[i],source.books[i],`第${i+1}篇越界修改`);
assert(!paragraphs.join('').includes('笑'));
next.revision={date:'2026-10-26',scope:[20],cumulativeUserChanges:[3,8,11,20],basis:'本次只重写第20篇；其余29篇与本次修改前逐字一致。',productionSynced:false};
next.approval.history.push({date:'2026-10-26',decision:'按用户要求仅重写第20篇，使浇花过程与结尾连贯；其余29篇不动，待审阅，未出图。'});
next.wordingChanges.push({date:'2026-10-26',number:20,oldNumber:source.books[19].oldNumber,beforeTitle:source.books[19].title,afterTitle:next.books[19].title,before:source.books[19].paragraphs,after:paragraphs,source:'user-requested-rewrite'});
next.draftOnlyChanges=[...new Set([...(next.draftOnlyChanges||[]),20])];
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const txt=['第一级30篇完整文案｜恢复稿基础上按用户要求修改第3、8、11、20篇',
 '2026-10-26｜本次仅重写第20篇，其余29篇与本次修改前一致。未出图、未同步应用或PDF。',
 ...next.books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n';
fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(next,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,name+'.txt'),txt,'utf8');
const saved=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const changed=saved.books.filter((b,i)=>JSON.stringify(b)!==JSON.stringify(source.books[i])).map(b=>b.number);
assert.deepEqual(changed,[20]);
for(let i=0;i<30;i++)if(i!==19)assert.deepEqual(saved.books[i],source.books[i]);
fs.writeFileSync(path.join(dir,'第20篇修订-20261026.txt'),['20.《小花喝水》',...paragraphs].join('\n')+'\n','utf8');
const recordPath=path.join(dir,'当前版本与撤回记录-20261026.json');
const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));
record.status='restored-with-user-specified-stories-3-8-11-20';record.userAuthorizedChanges=[3,8,11,20];record.latestChangedStories=[20];
record.currentSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name+'.json'))).digest('hex');
record.productionChanged=false;record.illustrationsGenerated=0;
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,'本次修订说明-20261026.txt'),[
 '当前文案：补字改稿前恢复稿，按用户明确要求修改第3、8、11、20篇。',
 '本次只改第20篇《小花喝水》：孩子浇花，小虫到叶下避水；孩子把浇水当作小虫的小雨，停止浇水后小虫又出来。',
 '其余29篇完整书目对象已与本次修改前逐一核对一致，包含已改好的第3、8、11篇。',
 '此前三轮补字改稿与试排仍然撤回，历史字频和新增字报表不适用于当前正文。',
 '本次未出图、未同步阅读应用或PDF。'
].join('\n')+'\n','utf8');
console.log(JSON.stringify({changedStories:changed,other29ExactlyUnchanged:true,title:saved.books[19].title,paragraphs},null,2));
