'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const workspace=path.resolve(__dirname,'..'),out=path.join(workspace,'output/lamb-level1-comparison-20261025');
fs.mkdirSync(out,{recursive:true});
const manuscriptFile=path.join(workspace,'output/manuscript-level1-complete-review/第一级30篇完整文案-待确认.json');
const planFile=path.join(workspace,'little-protagonist/content/level1-character-plan.json');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const before=[manuscriptFile,planFile].map(file=>({file,sha256:hash(file)}));
const manuscript=JSON.parse(fs.readFileSync(manuscriptFile,'utf8')),plan=JSON.parse(fs.readFileSync(planFile,'utf8'));
const vocabulary=JSON.parse(fs.readFileSync(path.join(workspace,'output/level1-vocabulary-audit-20261025/第一级词汇覆盖与复现核查.json'),'utf8'));
const han=text=>text.match(/\p{Script=Han}/gu)||[];
const rows=['一二三四五六七八九十','两只头又了不大小上下','多少白天云山太阳月亮','星马牛羊兔虫鸟花草树','地吃看走笑来飞爱是跑','跳高兴快乐好的爸妈我'];
const core=[...rows.join('')];assert.equal(core.length,60);assert.equal(new Set(core).size,60);
const books=manuscript.books,bodyChars=new Set(),frequencies=new Map();
const ourBooks=books.map(book=>{
  const chars=han(book.paragraphs.join('')),unique=[...new Set(chars)],fresh=unique.filter(c=>!bodyChars.has(c));
  for(const ch of chars){bodyChars.add(ch);frequencies.set(ch,(frequencies.get(ch)||0)+1);}
  return {number:book.number,oldNumber:book.oldNumber,title:book.title.replaceAll('CHILD','小石头'),bodyHanCount:chars.length,paragraphs:book.paragraphs.length,uniqueCharacters:unique.length,newCharacters:fresh};
});
const total=ourBooks.reduce((n,b)=>n+b.bodyHanCount,0),lengths=ourBooks.map(b=>b.bodyHanCount).sort((a,b)=>a-b),top10=[...frequencies].sort((a,b)=>b[1]-a[1]).slice(0,10);
const stages=[0,10,20].map(start=>{
  const sample=books.slice(start,start+10),chars=sample.flatMap(b=>han(b.paragraphs.join(''))),unique=[...new Set(chars)];
  return {stories:`${start+1}—${start+10}`,bodyHanCount:chars.length,meanBodyHanCount:chars.length/10,distinctCharacters:unique.length,newCharacters:ourBooks.slice(start,start+10).reduce((n,b)=>n+b.newCharacters.length,0),targetCharactersInBlock:unique.filter(c=>plan.characters.includes(c)).length,additionalCharactersInBlock:unique.filter(c=>!plan.characters.includes(c))};
});
const lambTitles=['藏西瓜','爸爸是我的天空','不高兴的毛毛虫','天啊，我的跳跳虫','我是？','我吃我吃我吃吃吃','小小的，大大的','生日快乐，小兔！','我爱问妈妈','七只小山羊'];
const sources=[
 {label:'主创分享会现场报道（2022-04-22）',url:'https://www.cbbr.com.cn/contents/533/79194.html',supports:'童趣主创讲解先定分级字表、再写完整故事；多维难度控制；字表、字卡、阅读游戏与家长导读。'},
 {label:'UCL公开讲座PDF，第5页实物图（2023）',url:'https://ci.ioe.ac.uk/wp-content/uploads/2023/11/Graded-Readers-by-Jia-Ding.pdf',localFile:path.join(out,'sources/UCL-Graded-Readers-Jia-Ding-2023.pdf'),render:path.join(out,'sources/UCL-level1-wordlist-page5.png'),supports:'右侧明确标小羊上山，总字表60字；本册超纲字毛、做、出另列。左侧是另一套迪斯尼书，不混用。'},
 {label:'浙江新华系统云台购同ISBN书目',url:'https://www.yuntaigo.com/book.action?recordid=bGJ6YmhiemM5Nzg3MTE1NTQ1ODI0',supports:'ISBN9787115545824、10册目录与内容介绍；目录列举顺序不作为难度顺序。'},
 {label:'福建日报采访、福建省政府转刊（2025-07-15）',url:'https://www.fj.gov.cn/xwdt/fjyw/202507/t20250715_6967219.htm',supports:'品牌负责人介绍第1册以少量汉字和图文比较组织花草、大山、地球及太阳的大小关系。'},
 {label:'新华书店同ISBN商品元数据',url:'https://item.xhsd.com/items/110000103082432',supports:'核对同一套版次标识；商品页240页/字数70000不是已核算的10册正文阅读量。'}
];
assert.ok(fs.existsSync(sources[1].localFile));assert.ok(fs.existsSync(sources[1].render));
const referenceRows=core.map(ch=>({character:ch,inOur200Plan:plan.characters.includes(ch),inOurCurrentBody:bodyChars.has(ch),ourOccurrences:frequencies.get(ch)||0,ourStories:books.filter(b=>han(b.paragraphs.join('')).includes(ch)).map(b=>b.number)}));
const summary={ourStories:30,ourBodyCharactersTotal:total,ourMeanBodyLength:total/30,ourMedianBodyLength:(lengths[14]+lengths[15])/2,ourBodyLengthRange:[lengths[0],lengths.at(-1)],ourParagraphs:ourBooks.reduce((n,b)=>n+b.paragraphs,0),ourDistinctCharacters:bodyChars.size,ourTargetCharacters:200,ourUsedTargetCharacters:vocabulary.summary.targetUsed,ourMissingTargetCharacters:vocabulary.summary.targetMissing,ourAdditionalCharacters:vocabulary.summary.additionalCharacters,
  lambStories:10,lambCoreTargetCharacters:60,lambFullBodyDistinctCharacters:null,lambFullBodyLength:null,lambWholeSeriesRecurrenceCounts:null,
  first10OurDistinctCharacters:stages[0].distinctCharacters,first10OurPlannedTargetCharacters:stages[0].targetCharactersInBlock,first10OurAdditionalCharacters:stages[0].additionalCharactersInBlock,
  ourCoverageOfLambCore:referenceRows.filter(r=>r.inOurCurrentBody).length,lambCoreMissingFromOurCurrentBody:referenceRows.filter(r=>!r.inOurCurrentBody).map(r=>r.character).join(''),top10SharePercent:+(top10.reduce((n,r)=>n+r[1],0)/total*100).toFixed(1)};
assert.equal(total,1578);assert.equal(bodyChars.size,180);assert.equal(stages[0].distinctCharacters,96);assert.equal(summary.ourCoverageOfLambCore,51);
const conclusions=[
 '两套一级的尺度不同：对方10册围绕60个核心字；我们计划30篇200个目标字。200/30约6.7、60/10为6，这个粗比说明200字并非30篇不能尝试，不能把漏字问题推给目标大。真正还要比较每篇阅读量、复现、情节与图片承担的内容。',
 '我们的30篇合计1578字、平均52.6字，是很短的阅读单元。本数不是同一计量单位；未取得对方10本全量正文，不能编造对方总字数、每篇长度或字频，再声称谁是几倍。',
 '我们前10篇就铺开96个实际不同字，其中93在我们的200字表内，3个是表外。后续仍没有把目标覆盖和回访安排补齐。逐篇删改改善了语言，却让短、让、明等字退出；只重算新字数量，没有重新维护整级复现，是当前制作方法的问题。',
 '公开主创说明强调字表、字词、句式、情节和文体一起控制，书后还有迁移活动。我们目前有用字统计，但统计清单不能替代字词任务的组织。',
 '从公开内容示例看，小小的，大大的把大小比较放入不同对象和尺度，熟字因此带出新关系。这是内容分析，不是抄写或逐页复原。我们旧纸路稿主要是摆放道具，旧日出稿主要是依时间报景色，缺少孩子的目标、预期或发现；短句本身不能解决这个问题。',
 '熟悉角色和道具可以复用，但情节类型要变化。喝水跨人、花、兔，石头跨多个用途，已经体现较好的换情境复现；单篇重复月亮5次、小虫4次仍不等于跨篇巩固。',
 '人物定制是我们的特色，不必因此把所有故事写成我操作物品的记录。对话、比较、误认、节奏、生活愿望和科普发现都可以保留同一主角。并非每篇都要笑话或反转。',
 '下一步应为30篇列同一张矩阵：本篇完整故事/概念任务、目标新词、调用熟词、后面哪几篇再次出现。单篇改完立即回查缺字及复现断点。保留第1、2篇的父母领读定位，不自行改一级200字目标，也不照抄对方60字或故事。'
];
const report={date:'2026-10-25',scope:'按ISBN9787115545824的第一级10册版公开资料对照；只研究、比较，不改文稿、不生成绘本插画。',sources,summary,lamb:{coreRows:rows,coreCharacters:core,titles:lambTitles,supplementaryCharactersObserved:['毛','做','出'],titleOrderIsNotTeachingOrder:true,limitations:['没有取得10本全量正文，未给出其逐字复现次数或正文总字数。','1700字阅读量、每册超纲字最多5个尚未核实为可用一手数据，不采用。','商品页总页数包含装帧与附加内容，不能直接当正文页数。']},ourBooks,stages,referenceRows,conclusions,unchangedInputs:before};
for(const row of before)assert.equal(hash(row.file),row.sha256);
fs.writeFileSync(path.join(out,'小羊上山第一级与当前30篇对照.json'),JSON.stringify(report,null,2)+'\n');
const text=['小羊上山第一级与当前30篇：字表、内容及组织方法对照','核查日期：2026-10-25',report.scope,'','一、先核对尺度',
 '小羊上山第一级：10个故事，60个核心目标字；实物把本册超纲字另列。因此60不是10册全部正文不同汉字的实测总数。',
 `我们：30篇，计划200个目标字；当前正文用${summary.ourDistinctCharacters}个不同字，其中${summary.ourUsedTargetCharacters}个原目标字、${summary.ourAdditionalCharacters}个表外字，原目标缺${summary.ourMissingTargetCharacters}字。`,
 '', '二、实物字表（原图右侧，第5页）',...rows.map(row=>[...row].join(' ')),
 '原图下框另列：本册超纲字 毛、做、出。左侧图属于迪斯尼我会自己读，不纳入本表。',
 `交叉对照：我们的正文覆盖这60字中的${summary.ourCoverageOfLambCore}字，尚无${summary.lambCoreMissingFromOurCurrentBody}。这只用于比较两套字池，不说明应照搬对方字表。`,
 '', '三、10册目录（非难度顺序）',...lambTitles.map((title,i)=>`${i+1}. ${title}`),
 '', '四、我们的正文阅读量',`总计${total}字，平均${summary.ourMeanBodyLength}字/篇，中位${summary.ourMedianBodyLength}字，单篇${summary.ourBodyLengthRange.join('—')}字，共${summary.ourParagraphs}段。段号不等于已排版的书页。`,
 ...stages.map(s=>`第${s.stories}篇：正文${s.bodyHanCount}字，均${s.meanBodyHanCount}字/篇，本组${s.distinctCharacters}个不同字，相对前文新增${s.newCharacters}字。`),
 '', '五、内容差别与判断',...conclusions.map((s,i)=>`${i+1}. ${s}`),
 '', '六、不作没有依据的精确比较',...report.lamb.limitations,
 '', '七、逐字交叉核对（小羊60字→我们的现稿）',...referenceRows.map(r=>`${r.character}｜我们的原200字表${r.inOur200Plan?'有':'无'}｜正文${r.ourOccurrences}次｜篇号${r.ourStories.join('、')||'无'}`),
 '', '八、我们的30篇字量',...ourBooks.map(b=>`新${b.number}／原${b.oldNumber}《${b.title}》：正文${b.bodyHanCount}字、${b.paragraphs}段、${b.uniqueCharacters}个不同字，首次字${b.newCharacters.length}个。`),
 '', '九、来源与核对范围',...sources.flatMap(s=>[s.label,s.url,s.supports,s.localFile?`本地保存：${s.localFile}`:'']),
 '', '原30篇稿件和原200字表的SHA256已在运行前后核对，本次未变更。'];
fs.writeFileSync(path.join(out,'小羊上山第一级与我们30篇的差别.txt'),text.join('\n'));
console.log(JSON.stringify({summary,stages,sourceCount:sources.length,manuscriptUnchanged:true,report:path.join(out,'小羊上山第一级与我们30篇的差别.txt')},null,2));
