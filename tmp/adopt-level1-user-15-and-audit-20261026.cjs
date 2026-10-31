'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),repo=path.join(root,'little-protagonist');
const legacy=path.join(root,'output/manuscript-level1-complete-review');
const legacyPath=path.join(legacy,'第一级30篇完整文案-待确认.json');
const original=JSON.parse(fs.readFileSync(legacyPath,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const originalHash=hash(legacyPath);
const {listBooks}=require(path.join(repo,'miniprogram/lib/stories'));
const {DEFAULT_PROFILE}=require(path.join(repo,'miniprogram/lib/profile'));
const {defaultMembers}=require(path.join(repo,'miniprogram/lib/family'));
const art=require(path.join(repo,'miniprogram/lib/layered-art'));
const production=listBooks(DEFAULT_PROFILE,defaultMembers(),{includeApproved:true});
const watched=['miniprogram/lib/stories.js','miniprogram/lib/level1-approved.js','miniprogram/lib/family.js','miniprogram/lib/layered-art.js','miniprogram/lib/first-ten-art.js','miniprogram/lib/books-eleven-thirteen-art.js','miniprogram/lib/books-seventeen-nineteen-art.js','preview/index.html'];
const hashes=Object.fromEntries(watched.map(p=>[p,hash(path.join(repo,p))]));
const replacements={
1:['你好！我是CHILD。','我的名字叫CHILD。','你的名字是什么呢？','我五岁了。你几岁呢？','我上大班了。','你也有名字吗？'],
4:['我有两只小手。','我用小手学做小花。','我做了一朵又一朵。','小手开，小花开。','小手合上，小花不见了。','小手又开，小花又开。','你的小花开了吗？'],
5:['山上有两朵白云。','白云来了，山不见了。','“山呢？”','风来了，云走了。','山出来了！','山没有走，是云走了！'],
6:['下大雨了！下雨啦！','小伞开了。我坐在伞下，看雨。','小花在雨中。','“小花，来！”小花没来。','“花不来，我去！”','我在伞下，小花也在伞下。','雨在伞上，伞下有我，也有花。','我笑了。'],
7:['大石头下，地上有小石头。','这是小石头的家。','我拿起小石头。','我走，小石头也走。','我要回家去了。','我把小石头拿起来，放回大石头下。','“小石头，你回家了！”','我也回家了。'],
9:['小车的家，有两个大门。','一个入口，一个出口。','我会开小车，从入口进去，从出口出来。','我不玩了，小车也要回家。','我把小车开回家，关上门。'],
10:['我要找小球玩。','谁看见小球了？小球在哪？','我看看小车里，没有。','我看看小车前，也没有。','我看看小车后，也没有。','门后呢？小球在这里！','“找到你了！”'],
11:['小树，你好！','我和小树，谁高？','小树比我高一点。','我站在小石头上。','“这回，谁高？我高！”','我下来，小树又高了。','我看看脚下的小石头，笑了。','“明年我还要和小树比高高！”'],
13:['我听见叫声。谁在叫？','我看看树上，是小鸟在叫。','“小鸟，下来和我玩，好吗？”','小鸟不叫了。谁又在叫？','我看看树下，是小猫在叫。','“小猫，你也来！”','小鸟呢？小鸟飞出来了，不在树上了。','我一看，小鸟在小车上！','“小鸟，你来了！”'],
14:['我有一个红红的球。','我有一个黄球。','“小猫，你要红球吗？”','“红球给你。黄球也给你。”','小猫不来玩。','我把红球推过去。','小猫跑来了，我笑了！','我和小猫一起玩！'],
15:['这是小猫的床。','小猫想睡了。','床上有小球，我把小球拿下来。','床上还有小车，我把小车也拿下来。','小球、小车都拿下来，放好了。','“小猫，上床睡吧。”','小猫上了床，睡了。']
};
const ids=['intro','flower','family','hands','mountain','rain','stone',null,'car','ball','tree','water','calling','catball','catbed'];
const decisions={
1:{category:'仅更新文字',action:'现有介绍自己、姓名、年龄、班级画面可沿用。只将结尾改成“你也有名字吗？”，保持个性化字段。',reuse:'全部主要场景与人物',scope:'换文字和统计，不重画插画'},
2:{category:'题材重做',action:'原画是春日照顾花、花瓣飞走；新稿为下雪。需重新设计雪景、雪花数量和进入草丛的结尾，并适配雪天衣着；不能用旧花瓣改颜色冒充雪。',reuse:'既有画风、人物母版比例、合成方式',scope:'重做封面及故事插画，原数片诗四行保留'},
3:{category:'局部调整',action:'当前家人介绍后直接到“还有我、三口人”。须补“先只算爸爸妈妈为两口→忘了自己→三口”的视觉转折，错误计数页不能仍以无强调的三人全家福配“两口人”。',reuse:'庭院、家人素材、全家画面',scope:'重排人数分镜和人物组合，按真实家庭动态计算，不整本重画'},
4:{category:'局部调整',action:'现有张手做花与合手藏花动作可保留；把“学做、一朵又一朵、又开”安排成连续动作。保持手势花，不擅自添加纸花手工或新角色。',reuse:'hands-room、hands-flower-open、hands-flower-closed',scope:'调整动作节奏、页序与文字，必要时补手部特写'},
5:{category:'局部调整',action:'云挡山、风带走云的主线与现有图一致。但现有山景天空有多团云，新稿明确“两朵”，需要整理天空和可数云层，让数量清楚。',reuse:'山、庭院、前景、人物',scope:'修改云层及个别构图，不重做整本背景'},
6:{category:'局部调整',action:'原画以站着撑伞、走近花、蹲下共享伞为主。新增“坐在伞下看雨”需有对应坐姿画面；大雨、花仍淋雨、孩子走过去与共同遮雨须连贯。',reuse:'现有雨景、花、伞及其余动作',scope:'补或重合成坐着看雨的一处场景，调整开头结尾；不重画整套'},
7:{category:'仅更新文字',action:'大石下发现、拿起、带着走、送回、自己回家的过程已有对应图。新增“地上、回家去了”等文字可同步，保持同一颗小石头。',reuse:'全部主要场景与动作',scope:'换文字和分段；后文重复“拿起来”作为文字待核对点，不自行改稿'},
8:{category:'尚未制作需新做',action:'这篇对应旧第27篇，不在现有20本已插画书中。需要石头上发现→走近找不到→低头发现脚上小虫→同行问话的完整分镜，虫的移动在画面上可理解。',reuse:'人物母版、少量山石庭院和既有行走动作可参考',scope:'新做故事插画及脚上小虫揭晓特写，避免前页提前揭晓'},
9:{category:'仅更新文字',action:'双门玩具车库、入口、出口、进出和关门均已有对应画面。用新文字同步“两个大门、我会开小车”，可删并多余反复进出的页。',reuse:'车库、车辆、背景与主要动作',scope:'换字与轻量排页，不重画场景'},
10:{category:'分镜大改',action:'旧图在庭院寻找小土堆和玩具车，最终在屋内地面发现球；新稿要找车里、车前、车后，最终在门后发现球。车前、车后、门后揭晓是主要缺口，旧屋内球在地中央的图不能直接配门后。',reuse:'人物、玩具车、球、部分庭院室内背景',scope:'重排寻找路线，重点重做或重合成3处寻找/揭晓构图；保留可用素材'},
11:{category:'局部调整',action:'地面比较、站上低石头、下来小树又高的画面已有。重排其与新短句的对应，结尾加明年比高的约定，可用当下挥手/望树画面，不必生成未来长大的孩子。',reuse:'小树、低石头、比较场景与人物',scope:'调整标题与页序，补合适结尾构图；不重做整本'},
12:{category:'局部调整',action:'保留静水倒影、走动跟随、停下和问好的场景，删除手入水、倒影消失和恢复三段。补齐“我笑、水中我也笑”的对应，倒影必须来自同一完整人物，不另造真人表情。',reuse:'浅水背景、现有人物和倒影合成',scope:'删页重排与必要的镜像画面调整，不整本重画'},
13:{category:'局部调整',action:'旧图已具备听见声音、看树上鸟、看树下猫、树枝空了、鸟在小车上的揭晓。同步新问句和飞出描述，理顺页序；若表现飞行，优先只补鸟的动作层。',reuse:'树、鸟、猫、车和绝大多数既有场景',scope:'轻调页序/鸟的动作，不重画全书'},
14:{category:'仅更新文字',action:'现有红黄球、猫对静止球没反应、孩子推球、猫过来玩的画面吻合。同步“红红的、要红球吗、跑来了我笑了”等文字即可。',reuse:'全部主要场景、猫、球与动作',scope:'换字；沿用已确认人物，不重新绘制真人笑脸'},
15:{category:'局部调整',action:'对应旧第19本catbed，主要素材齐全。旧稿中有孩子把小车放进床再拿出的桥段，新稿要求拿下两件玩具让猫睡。须让两个玩具一开始都在床上，按先拿球再拿车、放好、猫上床睡重排。',reuse:'房间、猫床、醒猫/困猫/睡猫、小车小球、拿起动作',scope:'删除放车上床的旧分镜，局部重合成道具与动作，不整本重画'}
};
const books=original.books.slice(0,15).map((b,i)=>({number:i+1,originalNumber:b.oldNumber,id:ids[i]||'insect-new',title:b.title,
 paragraphs:replacements[i+1]||b.paragraphs,status:'user-specified-level1-text'}));
assert.equal(books.length,15);assert.equal(books[1].title,'下雪了');assert.equal(books[14].title,'小猫的床');
const audit=books.map(b=>{
 const id=ids[b.number-1],p=id?production.find(x=>x.id===id):null;
 assert(id===null||p);
 const plans=p&&id!=='family'?p.pages.map((_,i)=>art.planFor(id,i)):[];
 return {number:b.number,title:b.title,...decisions[b.number],existingId:id,
 existingShelfNumber:p?production.indexOf(p)+1:null,existingProductionTitle:p?.title||null,
 existingPages:p?.pages||[],targetParagraphs:b.paragraphs,
 existingScenes:plans.map((q,i)=>({page:i+1,background:q?.background,pose:q?.pose,beat:q?.beat||null}))};
});
const out=path.join(root,'output/level1-approved-15-20261026');fs.mkdirSync(out,{recursive:true});
const write=(n,v)=>fs.writeFileSync(path.join(out,n),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n','utf8');
const display=s=>s.replaceAll('CHILD','【孩子名字】');
const manuscript={title:'第一级15篇用户指定文稿',date:'2026-10-26',status:'user-specified-level1-text',level:1,bookCount:15,
 basis:'用户本条消息全文，保留词句，仅将直引号统一为中文引号。此15篇是当前第一级文案依据。',
 previous30StoryDocument:legacyPath,previous30Status:'历史参考文稿，不能继续作为当前第一级完整选篇',
 productionSynced:false,illustrationsGenerated:0,books};
write('第一级15篇-用户指定文稿.json',manuscript);
write('第一级15篇-用户指定文稿.txt',[manuscript.title,...books.flatMap(b=>['',`${b.number}.《${display(b.title)}》`,...b.paragraphs.map(display)])].join('\n')+'\n');
write('15篇绘本改造核查.json',{date:'2026-10-26',basis:'用户指定15篇，对照当前实际20本制作稿、图层分镜和浏览器页面。',
 scope:'只做评估及保存用户稿，不更新制作正文、不出图。',
 categories:Object.fromEntries([...new Set(audit.map(r=>r.category))].map(c=>[c,audit.filter(r=>r.category===c).map(r=>r.number)])),
 audit,inputHashes:hashes,visualEvidence:['浏览器书架仍为旧20本、无小虫在哪；家庭第5页三人同框；找球第7页球在屋内地中央；山景原图天空多团云。'],
 limitations:'属于文案/分镜/素材复用范围评估，不等于已逐页完成新稿排版、全部插画视觉验收或实际PDF打印验收。'});
write('15篇哪些要重做哪些可沿用.txt',[
 '第一级15篇绘本改造核查｜2026-10-26',
 '以用户本次指定15篇为当前第一级内容，评估对象为已有成品绘本的文字、分镜和插画。没有改写用户稿或制作新插画。',
 '结论：第2篇换题材重做，第8篇此前未制作需新做，第10篇大改主要寻找分镜；第3、4、5、6、11、12、13、15篇局部调整；第1、7、9、14篇插画可基本沿用，仅同步文字。',
 '当前20本制作稿仍旧，不能用聊天文稿已经更新代替成品已更新。新15篇也不能通过直接截取旧书架前15本得到：小虫需新增，小猫的床需从旧第19本提入，旧大鞋、小花喝水等不再列入本级。',
 ...audit.flatMap(r=>['',`${r.number}.《${r.title}》｜${r.category}｜现有${r.existingShelfNumber?'书架第'+r.existingShelfNumber+'本 '+r.existingId:'无对应成品'}`,r.action,'可复用：'+r.reuse,'制作范围：'+r.scope]),
 '',
 '全级共用调整：按15篇重排书架、封面编号、目录、页码、识字小结及累计字表。旧16—30篇及未入选的旧成品保留为后续素材，不自动定为第二级。不以复现目标擅自改写用户已定文字。',
 '文字连贯的可选核对点：第7篇前面已拿起小石头，后面又说拿起来，动作重复；若后续要改文字，可只删后一个拿起来。本次未改。',
 '复用人物与既有背景优先；需要新姿态时按现有人物母版补独立动作，不重绘用户真人五官，不把只裁切挪道具当作整本全新插画。',
 '以上是改造范围评估，未更新线上书架、Word、PDF，未出新图。'
].join('\n')+'\n');
const recPath=path.join(legacy,'当前版本与撤回记录-20261026.json');
const rec=JSON.parse(fs.readFileSync(recPath,'utf8'));
rec.currentLevel1Source=path.join(out,'第一级15篇-用户指定文稿.json');rec.currentLevel1BookCount=15;
rec.previous30BookDocument=legacyPath;rec.previous30BookDocumentStatus='historical-reference';
rec.status='user-defined-level1-15-stories-production-not-synced';rec.productionChanged=false;
fs.writeFileSync(recPath,JSON.stringify(rec,null,2)+'\n','utf8');
fs.writeFileSync(path.join(legacy,'当前第一级文稿入口.txt'),'当前第一级改为用户指定15篇。\n正式文案依据：'+path.join(out,'第一级15篇-用户指定文稿.json')+'\n此目录原30篇全文继续保留作历史参考，不能当作当前第一级选篇。\n应用、桌面旧Word和PDF尚未同步此15篇。\n','utf8');
assert.equal(hash(legacyPath),originalHash);
for(const [p,h]of Object.entries(hashes))assert.equal(hash(path.join(repo,p)),h);
console.log(JSON.stringify({out,level1Stories:15,categories:Object.fromEntries([...new Set(audit.map(r=>r.category))].map(c=>[c,audit.filter(r=>r.category===c).map(r=>r.number)])),productionFilesUnchanged:true,old30ManuscriptUnchanged:true},null,2));
