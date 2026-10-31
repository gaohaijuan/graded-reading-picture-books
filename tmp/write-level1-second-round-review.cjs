'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const workspace=path.resolve(__dirname,'..');
const out=path.join(workspace,'output/manuscript-level1-complete-review');
const root=path.join(workspace,'little-protagonist');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const manuscript=read(path.join(out,'第一级30篇完整文案-待确认.json'));
const checks=read(path.join(out,'逐篇用字与原稿保留检查.json'));
const baseline=read(path.join(out,'history/before-approved-suggestions-20261025/第一级30篇完整文案-待确认.json'));
const plan=read(path.join(root,'content/level1-character-plan.json'));
const hanCount=text=>(text.match(/\p{Script=Han}/gu)||[]).length;
const book=n=>manuscript.books.find(b=>b.number===n);
const prior=n=>baseline.books.find(b=>b.number===n);
assert.deepEqual(manuscript.books.slice(0,2).map(b=>[b.title,b.paragraphs]),baseline.books.slice(0,2).map(b=>[b.title,b.paragraphs]));
assert.deepEqual(manuscript.approval.confirmedBooks,[1,2]);
assert.equal(plan.characters.includes('擦'),false);
assert.doesNotMatch(book(20).paragraphs.join(''),/擦|洗脚/);
const story23={previousParagraphs:prior(23).paragraphs.length,currentParagraphs:book(23).paragraphs.length,previousHanCount:hanCount(prior(23).paragraphs.join('')),currentHanCount:hanCount(book(23).paragraphs.join(''))};
assert.equal(story23.currentParagraphs,6);
assert.ok(story23.currentHanCount<story23.previousHanCount*.75);
assert.deepEqual(manuscript.books.map(b=>b.oldNumber).sort((a,b)=>a-b),Array.from({length:30},(_,i)=>i+1));
const allFresh=checks.perStory.flatMap(r=>r.newCharacters);
assert.equal(new Set(allFresh).size,allFresh.length);
assert.equal(allFresh.length,checks.defaultUniqueBodyCharacters);
assert.deepEqual(checks.sourceChanges,[]);
const {CHILD_MODEL}=require(path.join(root,'miniprogram/lib/character-rig'));
const {BOOKS}=require(path.join(root,'miniprogram/lib/books-eleven-thirteen-art'));
const standing=BOOKS.tree.pages[2],raised=BOOKS.tree.pages[3];
const treeTop=920-650;
const standingTop=standing.placement.y-CHILD_MODEL.headHeight*standing.placement.scale;
const raisedTop=raised.placement.y-CHILD_MODEL.headHeight*raised.placement.scale;
assert.ok(standingTop>treeTop&&raisedTop<treeTop);
const treeGeometry={type:'existing-scene-configuration-check',treeTop,standingTop,raisedTop,conditionMet:true,artModified:false,note:'同一场景坐标下的既有母版配置核对；不是本轮新增插画或实物视觉验收。'};
const summaries={
  8:'孩子先过山，在山下等小虫；小虫下来后一起走，删掉原结尾的重复动作。',
  10:'寻找集中在小车和门后，用看看代替去玩具车里找；结尾直接找到球。',
  11:'正文明确小树比我高一点；已核对既有场景中站上低石阶后可以超过树的配置关系。',
  13:'结尾小鸟，你也来了改为小鸟，你来了，去掉承接不清的也。',
  14:'我把小球推过去改为我把红球推过去，明确推的是哪一个球。',
  15:'从床上拿玩具的两处拿出来都改为拿下来。',
  20:'不用擦，也不突然去洗脚；放好水后看着湿脚笑了，收在眼前的小意外。',
  23:'由9段缩成6段，保留短纸画路、接长纸、推车和猫坐路上；尾句小猫，让一让。',
  25:'我听见小鸟叫，我也笑了改为我听见小鸟叫，笑了。',
  26:'小兔喝水使水面动起来，孩子问是否喝了月亮；停喝后水中的月亮回来，角色有动作，疑问有回应。',
  29:'比较整幅画中家的大小，画不下就画更大的家，明确把火车画在家里，不再以门洞代替整个家。'
};
assert.deepEqual(Object.keys(summaries).map(Number),checks.correctedStories);
const entries=manuscript.books.map(b=>({number:b.number,oldNumber:b.oldNumber,title:b.title.replaceAll('CHILD','小石头'),status:b.number<=2?'用户确认保留，父母领读开篇':summaries[b.number]?'已按意见修订并复查':'保留上一轮稿，本轮通读未发现新的明确病句或因果断裂',note:summaries[b.number]||'',newCharacters:checks.perStory[b.number-1].newCharacters}));
const report={date:'2026-10-25',round:2,firstTwoConfirmedUnchanged:true,openingContext:'父母领读，不再以独读或单篇首次出现字数要求改写第1、2篇。',caCharacter:{inCurrentLevel1WorkingList:false,usedInStory20:false,note:'结论仅针对项目当前第一级工作字表，不推定所有分级体系。'},story23,treeGeometry,changedStories:checks.correctedStories,all30:entries,illustrationsGenerated:0,pdfRegenerated:false,productionSourcesChangedThisRound:checks.sourceChanges,scope:'本轮仅修订文稿和核对记录；保留此前已同步绘本的第3篇及5—7篇次序。待文稿确认后再按现有插画对应情况同步后续绘本。'};
const lines=['2026-10-25 第2轮文稿修订与复查','第1、2篇按用户明确要求原稿不改，作为父母领读的开篇；撤回上一轮对这两篇继续改写的建议。','擦不在当前项目第一级工作字表中，第20篇不用擦；这不是对所有分级体系的判断。',`第23篇由${story23.previousParagraphs}段、${story23.previousHanCount}个汉字，缩为${story23.currentParagraphs}段、${story23.currentHanCount}个汉字（不含标点）。`,'以下均为新篇号，原篇号保留最初30篇编号。','没有出图，没有重新导出PDF。本轮文稿不直接覆盖尚需核对插画对应的现有绘本。','','本轮修改全文'];
for(const n of checks.correctedStories){const b=book(n),r=checks.perStory[n-1];lines.push(`第${n}篇《${b.title}》（原第${b.oldNumber}篇）`,summaries[n],`新增生字（${r.newCount}字）：${r.newCharacters.join('、')}`,...b.paragraphs,'');}
lines.push('30篇逐篇核对结果');
for(const entry of entries)lines.push(`第${entry.number}篇《${entry.title}》（原${entry.oldNumber}）：${entry.status}`,entry.note,'');
lines.push(`当前默认正文共${checks.defaultUniqueBodyCharacters}个不同汉字；已按新稿重新统计，姓名不计入。`,`第11篇既有场景配置：树顶y=${treeTop}；站地面时头顶y≈${standingTop.toFixed(1)}；站石阶时头顶y≈${raisedTop.toFixed(1)}。y越小越高，该相对高度条件成立。`);
for(const name of ['2026-10-25文稿修订与复查-第2轮','2026-10-25逐篇复查与修改建议']){
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,name+'.txt'),lines.join('\n'));
}
console.log(JSON.stringify({checked:entries.length,changed:checks.correctedStories,story23,totalCharacters:checks.defaultUniqueBodyCharacters,firstTwoUnchanged:true,caInWorkingList:false,productionChanges:checks.sourceChanges,treeGeometry},null,2));
