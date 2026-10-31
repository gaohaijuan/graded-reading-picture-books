'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'output/manuscript-level1-complete-review');
const baseDir=path.join(root,'output/level1-manuscript-implemented-20261026/baseline');
const name='第一级30篇完整文案-待确认';
const baseline=JSON.parse(fs.readFileSync(path.join(baseDir,name+'.json'),'utf8'));
const current=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const history=path.join(dir,'history/third-user-text-20261026');
const paragraphs=['我家有几口人？','这是爸爸。','这是妈妈。','有两口人。','不对，把我自己忘了！','有三口人！'];
fs.mkdirSync(history,{recursive:true});
for(const ext of ['json','txt']){
 const dest=path.join(history,'修改前-'+name+'.'+ext);
 if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,name+'.'+ext),dest);
}
assert.equal(current.books.length,30);
for(let i=0;i<30;i++)if(i!==2)assert.deepEqual(current.books[i],baseline.books[i],`第${i+1}篇不是恢复原稿，停止写入`);
current.books[2]={...current.books[2],paragraphs,
 orderingReason:'完全采用用户指定的数家人、忘记自己、再把自己算进来的情节；不使用“数”字。',
 status:'user-specified-text',userDecision:'apply-user-provided-third-story-only-20261026'};
current.revision={date:'2026-10-26',scope:[3],basis:'补字改稿前的恢复稿，仅按用户明确指定修改第3篇。其他29篇题文及顺序保持原样。',productionSynced:false};
current.draftOnlyChanges=[...new Set([...(current.draftOnlyChanges||[]),3])];
current.approval=current.approval||{confirmedBooks:[],history:[]};
current.approval.confirmedBooks=[...new Set([...(current.approval.confirmedBooks||[]),3])].sort((a,b)=>a-b);
current.approval.history.push({date:'2026-10-26',decision:'第3篇完全采用用户给出的六句正文；其余29篇保持恢复稿，用户查看完整30篇后再继续。未出图。'});
current.wordingChanges=[...(current.wordingChanges||[]).filter(c=>!(c.number===3&&c.date==='2026-10-26')),
 {date:'2026-10-26',number:3,oldNumber:3,beforeTitle:baseline.books[2].title,afterTitle:current.books[2].title,before:baseline.books[2].paragraphs,after:paragraphs,source:'user-provided'}];
for(let i=0;i<30;i++)if(i!==2)assert.deepEqual(current.books[i],baseline.books[i]);
assert.deepEqual(current.books[2].paragraphs,paragraphs);
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const txt=['第一级30篇完整文案｜恢复原稿，仅第3篇按用户指定修改',
 '2026-10-26｜未出图、未同步阅读应用或PDF。姓名以【孩子名字】显示；年龄、班级与家庭沿用原稿示例。',
 ...current.books.flatMap(b=>['',`${b.number}.《${display(b.title)}》｜原第${b.oldNumber}篇`,...b.paragraphs.map(display)])].join('\n')+'\n';
fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(current,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,name+'.txt'),txt,'utf8');
const readback=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
const modified=readback.books.filter((b,i)=>JSON.stringify(b.paragraphs)!==JSON.stringify(baseline.books[i].paragraphs)||b.title!==baseline.books[i].title).map(b=>b.number);
assert.deepEqual(modified,[3]);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const recordPath=path.join(dir,'当前版本与撤回记录-20261026.json');
const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));
record.status='restored-with-user-specified-third-story';
record.currentSha256=sha(path.join(dir,name+'.json'));
record.userAuthorizedChanges=[3];record.newUserWordingApplied=true;
record.productionChanged=false;record.illustrationsGenerated=0;
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dir,'本次修订说明-20261026.txt'),[
 '当前文案：补字改稿前恢复稿，仅第3篇按用户本次指定修改。',
 '第3篇：'+paragraphs.join(' / '),
 '其他29篇与恢复基线逐篇逐字核对一致；不加入此前试排、补字或复现改写。',
 '此前三轮改稿及试排仍然撤回，目录中的历史频次与新增生字表不适用于当前稿。',
 '本次只更新审阅文稿，未出图、未同步应用或PDF。'
].join('\n')+'\n','utf8');
console.log(JSON.stringify({changedStories:modified,other29ExactlyMatchBaseline:true,third:paragraphs,txt:path.join(dir,name+'.txt')},null,2));
