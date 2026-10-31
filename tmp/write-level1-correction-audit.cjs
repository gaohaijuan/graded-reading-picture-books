'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../output/manuscript-level1-complete-review');
const manuscript=JSON.parse(fs.readFileSync(path.join(out,'第一级30篇完整文案-待确认.json'),'utf8'));
const checks=JSON.parse(fs.readFileSync(path.join(out,'逐篇用字与原稿保留检查.json'),'utf8'));
const issues=[
  {number:2,kind:'起步阅读难度与搭配',quote:'我的花有好多片。／飞入草丛都不见。',problem:'花有好多片省去了正常名词，搭配生硬；儿歌含丛等较繁字，且按新顺序本篇有21个首次出现字，不能当成已经解决的低负担独读稿。',suggestion:'若保留原儿歌，按亲子共读处理；若作为起步独读篇，另写围绕小花、风和花瓣的小故事，保留正常词花瓣，不为少一个字截断名词。当前暂不擅自替换这篇。'},
  {number:8,kind:'情节趣味可增强',quote:'我下山了，小虫在山上。／小虫过了小山。／我坐在山下，小虫走了。',problem:'并非明显病句，但没有突出孩子停下来等小虫，结尾信息重复；小山若画成远处大山，过山时间也难理解。',suggestion:'可改为我下山了，小虫还在山上。／我在山下等小虫。／小虫下来了。／我们一起走。突出等待后的会合；后续仅核对原画是否是可跨越的小土坡，本轮不出图。'},
  {number:10,kind:'空间与寻找过程',quote:'我去小山上找。／我去小车里找。',problem:'找家里的球突然去小山，场景绕行偏机械；前篇小车是玩具，去小车里找容易被理解为孩子进入玩具车。',suggestion:'把寻找集中在一个游戏场景，例如我看看小车里，没有。／小车后也没有。／原来，小球在门后！通过查看而非走进玩具；修改后需重算原等新增字。'},
  {number:11,kind:'依赖画面，待核对',quote:'小树高，我不高。／我站在小石头上。／这回，我高！',problem:'文字成立的条件是小树原本只比孩子高一点、小石头足以让孩子超过树；仅凭正文不能保证现有画面满足。',suggestion:'先核对既有画面的相对高度。若不成立，应改为小树比我高一点等自然表达，并计入比等新字。这是画面条件风险，不直接判定为病句。'},
  {number:13,kind:'承接不清',quote:'小猫，你也来！／小鸟，你也来了！',problem:'前面邀请小猫，没有交代小猫真的来到我身边，结尾也来了的对应对象不明确。',suggestion:'结尾改为小鸟，你来了！即可，不必为了也再添一段猫的动作。'},
  {number:14,kind:'动作对象不明',quote:'红球给你。黄球也给你。／我把小球推过去。',problem:'前面有两个球，后面没有说明推哪一个。',suggestion:'明确为我把红球推过去。让读者看清我推、球动、猫跑来的因果，保留动作转折。'},
  {number:15,kind:'动词搭配',quote:'床上有小球，我把小球拿出来。／床上还有小车，我把小车也拿出来。',problem:'普通开放床面不是容器，拿出来的方向表达不够自然。',suggestion:'两处拿出来改为拿下来，与床上保持对应。'},
  {number:20,kind:'结尾动机偏弱',quote:'我的脚湿了！／小花，你喝好了，我要去洗脚了。',problem:'脚被清水打湿，可以洗脚，但正文没有给出额外理由；事情的直接后果是湿，结尾突然转向洗，削弱眼前的小意外。',suggestion:'把结尾收在处理湿脚，例如我把水放好，擦擦脚。新增擦应如实计入，不把需要的新词截断。'},
  {number:25,kind:'也的承接偏松',quote:'我听见小鸟叫，我也笑了。',problem:'此前没有谁笑，也笑了的对应不清，属于可直接简化的表达。',suggestion:'改为我听见小鸟叫，笑了。或小鸟叫了。我笑了。'},
  {number:26,kind:'情节重复，可选优化',quote:'水动了。水中的月亮不见了！／水不动了，水中的月亮又回来了。',problem:'与第12篇同样采用水动、影像消失、静后回来，小兔只陪等，独立故事的变化不多；作为复现篇可以成立。',suggestion:'若保留，明确其作用是复现；若增加趣味，围绕天上一个、水中一个的发现展开，再让孩子和小兔观察两个月亮。不为接下一篇硬放入没有作用的角色。'},
  {number:29,kind:'空间与解决结果',quote:'家有一个小门。／门太小，画不下！／我再画一个大门。／我把小火车画在大门里。',problem:'给小车画家逐渐变成往门内画火车，门和整个家的关系不够清楚；补一个大门后是否真正有能放下火车的家，交代偏弱。',suggestion:'把大小比较落在整个画中的家，例如我画个小小的家。／小火车画不下！／我再画个大大的家。最后明确小火车画在家里，不让真实火车通过画里的门。'}
];
for(const issue of issues){const book=manuscript.books.find(b=>b.number===issue.number);assert.ok(book);for(const fragment of issue.quote.split('／'))assert.ok(book.paragraphs.join('').includes(fragment),issue.number+': quote must match manuscript');}
const corrected=[3,23,30],reordered=[5,6,7];
const allBooks=manuscript.books.map(book=>({number:book.number,oldNumber:book.oldNumber,title:book.title.replaceAll('CHILD','小石头'),result:corrected.includes(book.number)?'已按本次要求修改':reordered.includes(book.number)?'按要求仅换序，正文不改':issues.some(i=>i.number===book.number)?'发现待审建议':'本轮未发现明确病句或因果断裂；不等于教学验收',issues:issues.filter(i=>i.number===book.number)}));
const report={date:'2026-10-25',scope:'按用户本次要求修改第3、23、30篇及第5—7篇次序；其他发现仅列建议，未自动采纳。',corrected,reordered,illustrationsGenerated:0,productionSynced:['第3篇','已完成绘本第5—7篇顺序'],pdfRegenerated:false,allBooks,issues,characterNote:{total:checks.defaultUniqueBodyCharacters,firstThree:checks.perStory.slice(0,3).map(r=>r.newCount),greaterThanSevenAfterOpening:checks.perStory.slice(3).filter(r=>r.newCount>7).map(r=>({number:r.number,newCharacters:r.newCharacters})),note:'第3篇删掉难字后，它们若在后文仍有必要会后移首次出现位置；因此不再沿用旧稿第4篇起每篇最多7字的结论。'}};
fs.writeFileSync(path.join(out,'2026-10-25逐篇复查与修改建议.json'),JSON.stringify(report,null,2)+'\n');
const lines=['2026-10-25 30篇文稿复查与修改建议',report.scope,'以下篇号均为最新阅读顺序；原篇号保持最初30篇编号。','已完成绘本第3篇正文和第5—7篇排序已同步到阅读及后续导出数据源；未出新插画，未重新导出历史PDF。','',`用字复核：全文${checks.defaultUniqueBodyCharacters}个不同汉字，前三篇首次出现字为${report.characterNote.firstThree.join('、')}；第5、7、23篇各新增8字。不是按字数硬凑故事。`,'','本次修改全文'];
for(const n of corrected){const book=manuscript.books.find(b=>b.number===n),row=checks.perStory[n-1];lines.push(`第${n}篇《${book.title}》（原${book.oldNumber}）`,`新增${row.newCount}字：${row.newCharacters.join('、')}`,...book.paragraphs,'');}
lines.push('第5—7篇新旧次序');
for(const n of reordered){const b=manuscript.books[n-1];lines.push(`新${n}《${b.title}》←原${b.oldNumber}；正文和插画不改。`);}
lines.push('','逐篇检查结果');
for(const item of allBooks){lines.push(`新${item.number}／原${item.oldNumber}《${item.title}》：${item.result}`);for(const issue of item.issues)lines.push(`类型：${issue.kind}`,`原句：${issue.quote}`,`问题：${issue.problem}`,`建议：${issue.suggestion}`);lines.push('');}
lines.push('另：第1篇仍有20个首次出现字，第2篇21个；它们虽然暂保留原稿，也不能据此认定已经满足低负担独读标准。此处只报告，不擅自重写。');
fs.writeFileSync(path.join(out,'2026-10-25逐篇复查与修改建议.txt'),lines.join('\n'));
console.log(JSON.stringify({reviewed:allBooks.length,issues:issues.length,corrected,reordered,out},null,2));
