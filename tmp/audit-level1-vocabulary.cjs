'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const workspace=path.resolve(__dirname,'..'),root=path.join(workspace,'little-protagonist');
const manuscriptFile=path.join(workspace,'output/manuscript-level1-complete-review/第一级30篇完整文案-待确认.json');
const planFile=path.join(root,'content/level1-character-plan.json');
const baselineFile=path.join(root,'content/level1-series-recurrence-baseline.json');
const sourceFiles=[manuscriptFile,planFile,baselineFile,path.join(root,'miniprogram/lib/stories.js'),path.join(root,'miniprogram/lib/family.js')];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputHashes=sourceFiles.map(file=>({file,sha256:sha(file)}));
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const manuscript=read(manuscriptFile),plan=read(planFile),oldBaseline=read(baselineFile);
const books=manuscript.books,target=[...plan.characters],targetSet=new Set(target);
assert.equal(books.length,30);assert.equal(target.length,200);assert.equal(targetSet.size,200);
assert.equal(books[7].title,'小虫不走');assert.equal(books[22].title,'谁先笑');assert.equal(books[24].title,'谁还在睡');
const han=text=>text.match(/\p{Script=Han}/gu)||[];
const contexts=(term)=>books.flatMap(b=>b.paragraphs.flatMap((text,i)=>{
  let position=0,count=0;
  while((position=text.indexOf(term,position))!==-1){count++;position+=term.length;}
  return count?[{story:b.number,oldNumber:b.oldNumber,title:b.title.replaceAll('CHILD','小石头'),paragraph:i+1,count,quote:text.replaceAll('CHILD','小石头')}]:[];
}));
function occurrenceStats(term){
  const hits=contexts(term),byStory=new Map();
  for(const hit of hits)byStory.set(hit.story,(byStory.get(hit.story)||0)+hit.count);
  const numbers=[...byStory.keys()],intervals=numbers.slice(1).map((n,i)=>n-numbers[i]);
  return {term,totalOccurrences:hits.reduce((n,h)=>n+h.count,0),distinctStories:numbers.length,storyNumbers:numbers,
    perStory:[...byStory].map(([story,count])=>({story,count})),firstStory:numbers[0]??null,nextStory:numbers[1]??null,lastStory:numbers.at(-1)??null,
    firstReturnStoryNumberGap:intervals[0]??null,largestStoryNumberGap:intervals.length?Math.max(...intervals):null,
    firstReturnInterveningStories:intervals.length?intervals[0]-1:null,remainingStoriesAfterFirst:numbers.length?30-numbers[0]:null,contexts:hits};
}
const firstAppearance=[...new Set(books.flatMap(b=>han(b.paragraphs.join(''))))];
const flags=r=>!r.distinctStories?'未出现':r.distinctStories===1?'仅1篇':r.distinctStories===2?'仅2篇':'至少3篇（不等于已掌握）';
const allUsed=firstAppearance.map(ch=>({...occurrenceStats(ch),inTargetList:targetSet.has(ch)}));
const byCharacter=new Map(allUsed.map(r=>[r.term,r]));
const targetRows=target.map((ch,i)=>{
  const row=byCharacter.get(ch)||occurrenceStats(ch);
  return {...row,targetIndex:i+1,screen:flags(row),confirmedGroups:plan.confirmedGroups.filter(g=>g.characters.includes(ch)).map(g=>g.number)};
});
const missing=targetRows.filter(r=>r.totalOccurrences===0),auxiliary=allUsed.filter(r=>!r.inTargetList);
const onlyOne=allUsed.filter(r=>r.distinctStories===1),onlyTwo=allUsed.filter(r=>r.distinctStories===2),threePlus=allUsed.filter(r=>r.distinctStories>=3);
const lowTotal=allUsed.filter(r=>r.totalOccurrences<=2),earlyUnrepeated=onlyOne.filter(r=>r.firstStory<=20);
const longFirstReturn=allUsed.filter(r=>r.firstReturnStoryNumberGap>=6);
const lateNew=allUsed.filter(r=>r.firstStory>=25),lateUnrepeated=lateNew.filter(r=>r.distinctStories===1);

// Reading entries include ordinary words and useful phrases. Independent string
// searches deliberately retain nested entries, e.g. 衣服 within 穿衣服.
const groups=[
 ['称呼、问候、问句','你好 好吧 名字 什么 大班 五岁 几岁 爸爸 妈妈 我们 朋友 几口人'],
 ['人物、身体和穿着','小手 小脚 大人 衣服 小鞋 大鞋 耳朵 眼睛 小牙 自己'],
 ['事物与自然','小花 白云 小伞 石头 小石头 小虫 小草 小车 小球 小树 小鸟 小猫 小兔 小白兔 白兔 小床 红球 黄球 纸片 小纸片 红纸 果子 太阳 日出 月亮 菜叶 火车 小火车 绿树 红花 小鱼 新家 草丛'],
 ['动作、变化与搭配','合上 下雨 拿起 回家 放回 过去 看了看 出来 进去 开回 关上 看看 找到 站在 下来 放入 拿出来 等一等 回来 听见 叫声 看见 一起 拿下来 放好 穿上 穿好 穿衣服 穿鞋 起来 出门 喝水 不能 流到 不再 放在 拿回来 放进去 飞入 飞到 跑到 压住 不用 好吃 坐下 喝下去 跳过 跳过去 看日出'],
 ['空间、时间、数量及叠词','山上 伞下 雨中 伞上 门后 这里 脚下 水中 树上 树下 今天 早早 门口 天边 天上 水边 地上 家里 左边 右边 这回 一点 一口 一下 一条 一片 两只 一个 两个 十一 长长 小小 红红 黑黑 大大 好多'],
 ['实际使用的较长搭配','不见了 看不见 没有 在家 不走 小花开 小车前 小车后 等爸爸 还不能喝 我也笑了'],
 ['字表相关及标题核对词（可为0，未声称是已确认词表）','早上好 喜欢 哥哥 姐姐 弟弟 妹妹 爷爷 奶奶 他们 她们 外面 前面 后面 多少 高低 长短 快乐 开心 洗手 洗脚 冷水 明天 今年 生日 小牛 小羊 小马 小狗 看书 米饭 面包 西瓜 豆子 鸡蛋 书本 热水 什么名字']
];
const entryMap=new Map();
for(const [category,terms]of groups)for(const term of terms.split(' ')){
  assert.ok(term&&han(term).join('')===term);
  if(!entryMap.has(term))entryMap.set(term,{term,categories:[]});
  entryMap.get(term).categories.push(category);
}
const wordRows=[...entryMap.values()].map(entry=>({...entry,...occurrenceStats(entry.term),allCharactersAlreadyInBody:han(entry.term).every(c=>byCharacter.has(c)),outsideTargetCharacters:[...new Set(han(entry.term))].filter(c=>!targetSet.has(c))}));
const actualMultiword=wordRows.filter(r=>r.totalOccurrences>0&&han(r.term).length>=2);
const titleOnly=wordRows.filter(r=>r.totalOccurrences===0&&books.some(b=>b.title.includes(r.term))).map(r=>({...r,titleStories:books.filter(b=>b.title.includes(r.term)).map(b=>b.number)}));
const recordedOldWordTargets=read(path.join(root,'content/level1-stories-reviewed-30.json')).seriesReview.wordTargets;
const historicalWordQueries=recordedOldWordTargets.map(term=>({...occurrenceStats(term),basis:'旧v8编辑复查目标，非用户确认的独立词表；0次不自动代表必须补入。',explicitlyRejected:['共','咦'].includes(term)}));
const {defaultMembers,familyBook,createSibling}=require(path.join(root,'miniprogram/lib/family'));
const {listBooks}=require(path.join(root,'miniprogram/lib/stories'));
let extended=defaultMembers().map(m=>({...m,included:true}));
while(extended.filter(m=>m.included).length<12)extended=createSibling(extended,'youngerSister');
const profiles=[
 {name:'默认三口家庭',members:defaultMembers()},
 {name:'只选择孩子',members:[]},
 {name:'包含全部可选称谓的12人示例',members:extended}
];
const familyVariants=profiles.map(profile=>{
  const text=familyBook({},profile.members).pages.flat().join('');
  const unique=[...new Set(han(text))];
  return {name:profile.name,text,additionalPlanCharactersComparedWithDefaultBody:unique.filter(c=>targetSet.has(c)&&!byCharacter.has(c)),note:'仅是条件配置，不能合并为每个孩子都已接触。'};
});
const production=listBooks({name:'CHILD',age:5,className:'大班'},defaultMembers(),{includeApproved:true});
const shelfComparison=production.map((b,i)=>{
  const oldNumber=b.sourceNumber||b.number||i+1,m=books.find(row=>row.oldNumber===oldNumber);
  return {id:b.id,productionNumber:b.number||i+1,originalNumber:oldNumber,reviewNumber:m?.number??null,productionTitle:b.title,reviewTitle:m?.title??null,sameBody:m?b.pages.flat().join('')===m.paragraphs.join(''):false};
});
const confirmedGroups=plan.confirmedGroups.map(g=>({number:g.number,characters:g.characters,total:[...g.characters].length,used:[...g.characters].filter(c=>byCharacter.has(c)).join(''),missing:[...g.characters].filter(c=>!byCharacter.has(c)).join('')}));
const summary={targetCharacters:target.length,actualCharacters:allUsed.length,targetUsed:targetRows.length-missing.length,targetMissing:missing.length,targetCoveragePercent:(targetRows.length-missing.length)/targetRows.length*100,additionalCharacters:auxiliary.length,charactersIfAllMissingAddedWithoutRemovingCurrent:allUsed.length+missing.length,totalCharacterOccurrences:allUsed.reduce((n,r)=>n+r.totalOccurrences,0),
  actualAcrossStories:{one:onlyOne.length,two:onlyTwo.length,threeOrMore:threePlus.length},
  targetAcrossStories:{zero:missing.length,one:targetRows.filter(r=>r.distinctStories===1).length,two:targetRows.filter(r=>r.distinctStories===2).length,threeOrMore:targetRows.filter(r=>r.distinctStories>=3).length},
  actualOccursAtMostTwice:lowTotal.length,earlySingleStory:earlyUnrepeated.length,longFirstReturnCount:longFirstReturn.length,lateNewCharacters:lateNew.length,lateSingleStory:lateUnrepeated.length,
  multiwordEntriesFound:actualMultiword.length,independentQueries:wordRows.length,productionStories:production.length,productionBodiesMatchingCurrentReview:shelfComparison.filter(r=>r.sameBody).length};
assert.equal(summary.actualCharacters,summary.targetUsed+summary.additionalCharacters);
assert.equal(summary.targetCharacters,summary.targetUsed+summary.targetMissing);
assert.equal(onlyOne.length+onlyTwo.length+threePlus.length,summary.actualCharacters);
assert.equal(summary.actualCharacters,180);assert.equal(missing.length,43);assert.equal(auxiliary.length,23);
const expectedWords={爸爸:15,妈妈:1,衣服:2,月亮:5,太阳:3,早上好:0,自己:1,石头:15,火车:4};
for(const [term,count]of Object.entries(expectedWords))assert.equal(wordRows.find(r=>r.term===term).totalOccurrences,count,term);
const sourceChanges=inputHashes.filter(row=>sha(row.file)!==row.sha256);assert.deepEqual(sourceChanges,[]);
const method={scope:'仅核查最新30篇正文，五岁、大班、爸爸妈妈孩子三口示例；不改文稿、不出图。',excluded:'标题、目录、小结、编辑说明及个性化姓名不计入正文频次；CHILD为非汉字姓名占位符。',
  oldPlan:'项目保存的200字工作字表；只有前3组有单独确认记录，未找到已确认的逐词清单或固定复现验收线。',
  recurrence:'同时列字/词总次数、覆盖不同篇数、首见、下次见、篇号差。同篇出现5次仍只算1篇。篇号差不等于中间空白篇数，后者少1。',
  words:'多字词语和常用搭配按正文完整字符串独立检索，不删除标点跨句拼接；衣服/穿衣服、石头/小石头会重叠，因此频次不能相加为全书总词数。爸爸完整词15次与爸字形30次分别列，不混作同一指标。每个命中附篇号、段号及原句。清单是本轮阅读词形索引，不冒称此前已批准的教学词表。',
  longGapScreen:'首复现篇号差≥6只作为本次长间隔筛查项，不是掌握标准。',
  adequacy:'未出现、只在1篇出现、只出现1—2次，以及早段后长期未再出现均应优先复查。≥3篇仅为分组，不称已达标或已掌握。父母重读次数无法从文稿直接计算。',
  priorBaseline:{edition:oldBaseline.edition,characters:oldBaseline.characters.length,usedAsCurrentCounts:false}};
const report={date:'2026-10-25',method,summary,missing:missing.map(r=>r.term),auxiliary:auxiliary.map(r=>r.term),confirmedGroups,targetRows,allUsed,wordRows,onlyOne,onlyTwo,lowTotal,earlyUnrepeated,longFirstReturn,lateNew,lateUnrepeated,titleOnly,familyVariants,shelfComparison,historicalWordQueries,inputHashes,sourceChanges};
const out=path.join(workspace,'output/level1-vocabulary-audit-20261025');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'第一级词汇覆盖与复现核查.json'),JSON.stringify(report,null,2)+'\n');
const show=r=>`${r.term}｜${r.totalOccurrences}次｜${r.distinctStories}篇｜篇号：${r.storyNumbers.join('、')||'无'}｜首见：${r.firstStory??'无'}｜再见：${r.nextStory??'无'}｜最大篇号差：${r.largestStoryNumberGap??'无'}`;
const rowsText=['第一级200字逐项对照与全部实际用字频次','按原200字表顺序列出；其后列23个表外字。',method.scope,method.excluded,method.recurrence,''];
rowsText.push('原200字表逐字对照');
for(const r of targetRows)rowsText.push(`${r.targetIndex}. ${show(r)}｜${r.screen}`);
rowsText.push('','23个表外实际用字');
for(const r of auxiliary)rowsText.push(show(r));
rowsText.push('','180个实际用字（按正文首次出现顺序）');
for(const r of allUsed)rowsText.push(show(r));
rowsText.push('','仅出现1篇的字');for(const r of onlyOne)rowsText.push(show(r));
rowsText.push('','总共只出现1—2次的字');for(const r of lowTotal)rowsText.push(show(r));
rowsText.push('','首复现篇号差≥6的字（仅筛查）');for(const r of longFirstReturn)rowsText.push(show(r));
rowsText.push('','全部命中原句索引（篇号、段号不等于PDF页码）');
for(const r of allUsed)rowsText.push(`【${r.term}】`,...r.contexts.map(h=>`第${h.story}篇第${h.paragraph}段（${h.count}次）：${h.quote}`),'');
fs.writeFileSync(path.join(out,'200字对照与180字完整频次.txt'),rowsText.join('\n'));
const wordsText=['第一级完整词语与常用搭配核对',method.words,'字形全表另见200字对照与180字完整频次.txt；这里不把每个汉字都冒称为独立词。',''];
for(const [category]of groups){wordsText.push(category);for(const r of wordRows.filter(r=>r.categories.includes(category)))wordsText.push(show(r));wordsText.push('');}
wordsText.push('完整词语命中原句索引');
for(const r of wordRows.filter(r=>r.totalOccurrences>0))wordsText.push(`【${r.term}】`,...r.contexts.map(h=>`第${h.story}篇第${h.paragraph}段（${h.count}次）：${h.quote}`),'');
wordsText.push('旧v8编辑复查目标的附录核对（并非用户定稿词表；不因0次恢复已否决内容）');
for(const r of historicalWordQueries)wordsText.push(show(r)+(r.explicitlyRejected?'｜用户已明确删除，不建议为补数恢复':''));
fs.writeFileSync(path.join(out,'完整词语及常用搭配频次.txt'),wordsText.join('\n'));
const rowsFor=(terms)=>terms.split(' ').map(term=>wordRows.find(r=>r.term===term)||occurrenceStats(term));
const keyRows=rowsFor('名字 什么 爸爸 妈妈 入口 出口 衣服 早上好 喝水 小虫 小树 月亮 耳朵 眼睛 朋友 火车 自己 石头 等一等');
const overview=['第一级词汇覆盖、复现及问题核查（2026-10-25）',
 '结论：当前30篇没有覆盖原200字表，复现分布也偏集中。这里核查正文用字与词语设计，不改稿、不出图。',
 `原计划200字：已用${summary.targetUsed}字（${summary.targetCoveragePercent}%），未用${missing.length}字；正文另有${auxiliary.length}个表外字，实际去重${allUsed.length}字。`,
 `180个实际用字中：仅1篇出现${onlyOne.length}字，仅2篇出现${onlyTwo.length}字，至少3篇出现${threePlus.length}字。原目标内分布：未出现${summary.targetAcrossStories.zero}、1篇${summary.targetAcrossStories.one}、2篇${summary.targetAcrossStories.two}、至少3篇${summary.targetAcrossStories.threeOrMore}。`,
 `实际总共仅1—2次的字${lowTotal.length}个；在前20篇引入但到第30篇也没有跨篇再见的字${earlyUnrepeated.length}个。`,
 '', '一、对照依据与口径',method.oldPlan,method.excluded,method.recurrence,method.words,method.adequacy,
 `旧复现文件为${oldBaseline.edition}，记录${oldBaseline.characters.length}字；本次全部重算，未沿用旧数字。`,
 '旧indexWords按某词是否命中一个正文页记录一次，并非该词出现的实际总次数。本次逐次计数：例如第26篇首段月亮出现2次就计2次；不把标点删除后跨句拼出来的字符串算作词。',
 '', '二、未出现的43个目标字',missing.map(r=>r.term).join('、'),
 '', '三、23个表外字',auxiliary.map(r=>r.term).join('、'),
 '其中衣服的服、耳朵的朵、眼睛的睛、太阳的阳、月亮的亮、自己的自/己、菜叶的叶等是正常完整词语的组成部分，不能为了回到200字而截断词语。是否纳为辅助字应统一记录。',
 '', '四、关键词语频次',...keyRows.map(show),
 '', '五、需要处理的问题及建议',
 '1. 字表与当前故事覆盖有缺口。对43个缺字逐项决定保留为本级目标、在合适情节中补入，还是延期；不恢复被否决的纸路、冷水支线、漏数话术，也不为补名单硬编情节。',
 '2. 先区分目标字与辅助字。完整词语需要的表外字单列；本轮23个表外字不自动等于全都应删，也不等于已获批准的新增目标。',
 `如果保持现有正文全部180字，再把缺失43字都补入，真实总字量会至少达到${summary.charactersIfAllMissingAddedWithoutRemovingCurrent}字，不能仍说正文只有200字；补入新词若带来额外辅助字，还可能更多。`,
 '3. 同篇反复不等于跨篇巩固。小虫4次、月亮5次、火车4次都只有一篇；妈妈完整词只有第3篇1次，爸爸15次跨4篇。后续可让妈妈参与已有自然情境，不改已确认的第1、2篇。',
 '4. 标题不能补正文覆盖。早上好作为第18篇标题存在，但全文正文出现0次；早、上、好三个字都出现，仍不代表这个问候语被实际读到。火只在火车里出现，也不能据此认定火焰这一词义已教学；长目前只读长长的cháng，不代表zhǎng也出现。',
 `5. 末段新词的后续机会少。第25—30篇首次出现${lateNew.length}个不同字，其中${lateUnrepeated.length}字只在一篇。可标成首次接触，并规划本级后续复读材料/下一级自然复现，不强行把所有字塞进结尾。`,
 '6. 开篇是父母领读，不改第1、2篇。名字、什么、岁、班等目前只在第1篇，数字四、六、七、八、九、十等集中在第2篇；若仍作为长期目标，应安排后续自然复现，而不是要求开篇独读或重写原儿歌。',
 '7. 默认家庭不等于所有个性化配置。哥、姐、弟、妹、爷、奶可在选择相应成员时进入第3篇，但默认三口正文并没有；不能把各配置并集算作每个孩子都学过。年龄班级也应按实际配置核算。',
 `8. 当前核查对象是30篇新文稿，运行书架仍有${production.length}篇，正文逐字相同的映射仅${summary.productionBodiesMatchingCurrentReview}篇。文字审定后应同步同一版书架、打印与字表；旧PDF或旧v7/v8统计不能作为本稿达标证据。`,
 '', '六、复现次数是否足够',
 '现有证据只能回答：没有用全200字，而且不少字/词缺少跨篇复现，不能把现稿称作200字覆盖与巩固均完成。没有找到已确认的每字至少N次、至少N篇的统一门槛，因此不编造一个旧标准。',
 '下一步建议先把未出现、仅1篇、总共1—2次、早段很久不再见四类清单排优先级，再在自然情节里安排复现。若另设跨至少3篇等编辑筛查线，需要明确它是工作约定，不是孩子掌握的保证。',
 '', '七、全部已用字与词语清单',
 `实际180字（首次出现顺序）：${firstAppearance.join('')}`,
 ...groups.map(([category])=>`${category}：${wordRows.filter(r=>r.categories.includes(category)&&r.totalOccurrences>0).map(r=>r.term).join('、')}`),
 '', '八、前三组确认字的覆盖',...confirmedGroups.map(g=>`第${g.number}组：计划${g.total}字，已用${g.used.length}，缺：${g.missing||'无'}。`),
 '', '配套文件：200字对照与180字完整频次.txt；完整词语及常用搭配频次.txt；第一级词汇覆盖与复现核查.json。'];
fs.writeFileSync(path.join(out,'第一级词汇核查报告.txt'),overview.join('\n'));
console.log(JSON.stringify({summary,missing:missing.map(r=>r.term).join(''),auxiliary:auxiliary.map(r=>r.term).join(''),confirmedGroups:confirmedGroups.map(g=>({group:g.number,used:g.used.length,missing:g.missing})),keyRows:keyRows.map(({term,totalOccurrences,distinctStories,storyNumbers})=>({term,totalOccurrences,distinctStories,storyNumbers})),out},null,2));
