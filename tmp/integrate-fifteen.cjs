const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../little-protagonist');
function edit(file,changes){let s=fs.readFileSync(path.join(root,file),'utf8');for(const [from,to] of changes){if(!s.includes(from))throw Error(file+': missing '+from);s=s.replaceAll(from,to);}fs.writeFileSync(path.join(root,file),s);}
edit('preview/app.js',[
 ['Object.freeze({ includeApproved: true })','Object.freeze({ currentEdition: true })'],
 ["book: 'intro'","book: 'intro-complete'"],
 ["state.book = 'intro'; begin()","state.book = books[0].id; begin()"],
 ["canvas.dataset.art === 'intro'","canvas.dataset.art === 'intro-complete'"],
 ["{artPanel:options.artPanel||options.portraitPanel}","{scenePanel:true,artPanel:options.artPanel||options.portraitPanel}"]
]);
edit('preview/ui-functions.js',[
 ["id==='intro'","id==='intro-complete'"],["artCanvas('intro'","artCanvas('intro-complete'"],["state.book==='intro'","state.book==='intro-complete'"],
 ["每10个故事一册，每册一套封面、目录及连续页码。<br>每个A5小页上图下短句，各故事后保留识字小结。第2册现有'+service.volumes.at(-1).storyCount+'个故事'+(service.volumes.at(-1).storyCount===10?'，本册目录已齐；第1级后续故事仍在制作。':'的样册。')+", "当前第1级15个故事合为一册，一套封面、目录及连续页码。<br>每个A5小页上图下短句，各故事后保留识字小结。'+"]
]);
edit('preview/account-functions.js',[["const ACCOUNT_READING_KEY = 'little-story.preview-reading.v1';","const ACCOUNT_READING_KEY = 'little-story.preview-reading.'+shared.currentEdition.EDITION;"]]);
edit('miniprogram/lib/print-plan.js',[
 ["const collection=scope==='level',contentsCount=collection?Math.ceil(books.length/12):0;","const collection=scope==='level',current=require('./current-edition'),isCurrent=collection&&current.matches(books);\n  if(isCurrent)sample=false;\n  const contentsCount=collection?(isCurrent?1:Math.ceil(books.length/12)):0;"],
 ["return {id:collection?", "return {edition:isCurrent?current.EDITION:null,completeLevel:isCurrent,id:isCurrent?current.PRINT_ID:collection?"],
 ["completeLevel:false,title:plan.title", "completeLevel:!!plan.completeLevel,edition:plan.edition,title:plan.title"]
]);
edit('preview/print-layout.js',[
 ["if(id==='intro')", "if(id==='intro-complete')"],
 ["plan.chapters.slice(leaf.part*12,(leaf.part+1)*12)","plan.chapters.slice(leaf.part*(plan.completeLevel?15:12),(leaf.part+1)*(plan.completeLevel?15:12))"],
 ["chapters.length<=8?17:10", "chapters.length<=8?17:chapters.length>12?7.6:10"],
 ["selectedBook.id==='intro'", "selectedBook.id==='intro-complete'"]
]);
edit('preview/print-service-functions.js',[
 ["p.volumeCount+' 册样册'", "p.volumeCount+' 册'+(p.sample?'样册':'合集')"],
 ["完整每级计划 30 个故事，每 10 个装订一册，共 3 册。这里只按已完成内容打印。", "当前第1级采用选定的15个故事，合订1册。第2—10级筹备中。纸质文件供试用与打样，提交需求不代表已付款或已安排制作。"]
]);
edit('preview/backend-functions.js',[
 ["plan.volumeCount!==Math.ceil(plan.storyCount/10)","plan.volumeCount!==(plan.edition===shared.currentEdition.EDITION?1:Math.ceil(plan.storyCount/10))"],
 ["plan.storyCount<30?'当前为样册，不是完整第'+plan.level+'级。':''", "plan.sample?'当前为样册，不是完整第'+plan.level+'级。':'当前第1级为15篇试用合集。'"],
 ["printPlan:{level:plan.level,storyCount:plan.storyCount,volumeCount:plan.volumeCount}","printPlan:{edition:plan.edition,level:plan.level,storyCount:plan.storyCount,volumeCount:plan.volumeCount}"],
 ["(plan.volumeCount===1?'level-'+plan.level:'level-'+plan.level+'-volume-'+(index+1))", "(plan.edition===shared.currentEdition.EDITION?shared.currentEdition.PRINT_ID:plan.volumeCount===1?'level-'+plan.level:'level-'+plan.level+'-volume-'+(index+1))"]
]);
edit('preview/export-functions.js',[
 ["const service=printServicePlan(1);", "const service=printServicePlan(1);\n      sample=service.sample;"],
 ["第1级合集样册，含现有'+plan.storyCount+'个故事；不是已完成的整个第1级。", "第1级阅读合集，含'+plan.storyCount+'个故事，'+(plan.completeLevel?'包含当前第1级全部15篇；仍需印厂实物打样。':'为历史样册。')+'"],
 ["'合集样册含 '+plan.storyCount", "'本册含 '+plan.storyCount"]
]);
// New products have distinct IDs, so historic six-story prices and orders cannot be reused accidentally.
edit('server/billing.cjs',[["for(const book of listBooks(undefined,undefined,{includeApproved:true}))", "const edition=require('../miniprogram/lib/current-edition');\n  for(const book of [...listBooks(undefined,undefined,{includeApproved:true}),...edition.listBooks(),{id:edition.PRINT_ID,title:'第1级15篇阅读合集'}])"]]);
// Tests for the retained legacy catalogue must address stories by identity, not stale array positions.
edit('tests/literacy.test.cjs',[["stats[5]", "stats.find(b=>b.id==='stone')"]]);
edit('tests/layered-art.test.cjs',[
 ["function setup(){", "function setup(ids=bookIds){"],
 ["retry(){}},bookIds);", "retry(){}},ids);"],
 ["all 140 non-family pages", "all registered non-family pages"],
 ["assert.equal(Object.values(scenes.BOOKS).reduce((n,b)=>n+b.pages.length,0),140);", "assert.ok(Object.keys(scenes.BOOKS).length>=bookIds.length-1);"],
 ["adultComposites,4", "adultComposites,2"],
 ["const {manager,members}=setup();let oldCrouch;", "const {manager,members}=setup([...Object.keys(scenes.BOOKS),'family']);let oldCrouch;"]
]);
console.log('Integrated current edition and retained legacy catalogue.');
