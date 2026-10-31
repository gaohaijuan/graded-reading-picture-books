'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const files={manuscript:'output/manuscript-level1-complete-review/第一级30篇完整文案-待确认.json',audit:'output/level1-vocabulary-audit-20261025/第一级词汇覆盖与复现核查.json',plan:'little-protagonist/content/level1-character-plan.json'};
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const inputs=Object.entries(files).map(([role,file])=>({role,file,sha256:sha(file)}));
const manuscript=read(files.manuscript),audit=read(files.audit),plan=read(files.plan);
const out=path.join(root,'output/level1-editorial-matrix-20261025');fs.mkdirSync(out,{recursive:true});
const han=s=>s.match(/\p{Script=Han}/gu)||[];
const unique=a=>[...new Set(a)];
const body=b=>b.paragraphs.join('\n');
const actualFor=term=>manuscript.books.filter(b=>b.paragraphs.some(p=>p.includes(term))).map(b=>b.number);
const protectedNumbers=[1,2,3,5,6,7];
const replacements=[17,20,29,30];
// 此处只有编辑决策、场景与词路由。不得从这些字段生成“实际覆盖”数字。
const specs=[
 [1,'保留','你好，我是CHILD','向一起读书的人介绍自己，并邀请对方回应。','名字、你好、几岁、什么','父母领读；姓名、年龄、班级按实际设置；不重新质疑用户已确认的开篇。','现稿保留。名字由30的新书署名回访；什么等问句仍需后续具体安排。'],
 [2,'保留','我的花','借儿歌节奏看花片数量增加，再看花片飞入草丛。','一至十、两、片、小花、飞、不见','原儿歌保留，不改成花瓣。二没有作为字形出现，不能把“两”当“二”。','片/飞/不见由4、5、8、22、28等在不同事件中复用；二另放4。'],
 [3,'保留','我家有几口人？','认识实际选定的家人，最后把我也计入一家人。','爸爸、妈妈、我、家、几口人、我们','保留删去数一数、数好了、咦后的直接介绍；人数跟随家庭设置。','只统计实际选中的家庭分支；六个未选亲属仍登记为条件缺口。'],
 [4,'小修','我的小手','用两只手做花，让同读者按开合口令一起做。','小手、做、开、合上、一、二','保留手指花；拟用一/二对应开/合的游戏口令自然呈现二，不使用数一数。','不增加数数旁白，不变成口令清单；口令需要在下一轮完整短稿中验证。'],
 [5,'保留','山不见了','看见云遮住山，再发现云走而山未走。','山、白云、风、来、走、不见、出来','用户指定只换次序、正文不改。','云在12回访；不要为了补字给本篇追加那、低等新任务。'],
 [6,'保留','下雨了','发现小花不能走来，孩子主动走过去为花撑伞。','雨、伞、伞下、雨中、花、我去','用户指定只换次序、正文不改。','开/花/下复现前文，照顾植物的行动由20另一个真实任务迁移。'],
 [7,'保留','小石头回家','拿起、带走石头，离开时把它放回原处。','小石头、拿起、把、放回、家、回家','用户指定只换次序、正文不改。','拿放在15/20/21复用；石头在8/11/22/28保留原有回访。'],
 [8,'保留主线','小虫不走','把卷曲小草误看成虫，走近看清自己认错了。','小虫、小草、过去、看、笑','保留刚重写的误认揭晓；画面是同一小草从误认到看清，不是虫变草。','小虫仍仅此一篇，应标情境初见，不能因同篇出现4次就称跨篇巩固。'],
 [9,'小修','小车回家','从入口开入、出口开出，游戏结束把车收回去。','入口、出口、进去、出来、门外、关上、让','在门外开场、收车行动中安排外/让；不额外添加新动物、新车辆清单。','入口/出口目前只此篇，21可借车进出原车库回访，需有进出动作。'],
 [10,'小修','小球在哪','按车里、车后、门后寻找，找到自己的球。','小球、哪、里、后、找、那','找到时用那是我的小球等自然指认承接那；仍由孩子寻找，不让球无故自行移动。','位置词在21有真实操作；不另加多个无作用的搜寻地点。'],
 [11,'小修','我和小树谁高','站上石头再下来，比出站的位置改变了谁高。','小树、谁、高、站、脚、问','可以把提问写成我问小树；不写我比小树低，也不写树真的忽高忽低。','低另在27低下头的观察动作承接；不为复现高改动石头高度逻辑。'],
 [12,'定向小修','水中的我','用动作验证水中影像跟着我，触水后消失，水静后回来。','水中、自己、就、放入、拿出来、等一等','结尾认出是我自己；就只放在水动导致影像散开的因果句；不同时加鱼和眼睛分支。','自己在16自己穿鞋、30读到自己回访；动静因果在26迁移。'],
 [13,'定向小修','谁在叫','先听声音、再看来源，鸟从树上来到车上。','耳朵、听、小鸟、小猫、谁、叫','拟替换开头为用耳朵听后找来源，不增加段数；耳朵必须完整，不写耳。','耳朵在23用手做兔耳、27观察真兔回访；若23太长，宁可只留两次并记缺口。'],
 [14,'保留主线','小猫要小球吗','静放的球未引起猫玩，推球后猫跑来，孩子与猫一起玩。','红球、黄球、给、推、跑、一起玩','主线已说得通，暂不为动物名单擅自把猫改成狗。','它是动物主题改写的备选位置，但不能同时既算原猫故事保留又算新动物故事已安排。'],
 [15,'小修','小猫的床','把床上玩具拿下来放好，让想睡的猫能上床睡。','床、很、想睡、拿下来、放好、睡吧','很想睡服务猫要休息的目标，不写小车睡进鞋里。','想睡/睡在18/25保留；17若换题，晚需由26夜间开场补回。'],
 [16,'小修','大鞋和小鞋','试穿大鞋脱脚，再自己穿好合脚的小鞋。','大鞋、小鞋、穿、小脚、自己','只把自己放入穿鞋动作，保留鞋不合脚的结果；不绑定女宝一定穿妈妈高跟鞋。','自己接12，穿鞋接18；不在此硬讲旧鞋短或脚与鞋一样长。'],
 [17,'拟换题','先洗手','想吃面包，发现手黑；洗好后发现大人的手也黑，反过来提醒大人洗。','洗手、面包、小手、黑、吃、也','替换重复的睡前题；只承担洗/面/包，不同时摆米饭、蛋和全部亲属。','照护者依真实设置；洗手可在24吃西瓜前、27喂兔后复现，须控制篇幅。'],
 [18,'小修','早上好','孩子已经穿好，大人还没起，孩子等待一起出门。','今天、早、衣服、穿鞋、快、喜欢、等','喜欢放在想出门玩的愿望句；保留孩子准备好、大人没起的角色反差。','冷有穿衣因果才可候选，不作为本方案已落实字；不要加一整段天气说明。'],
 [19,'保留主线','这水太热了','想喝水但太热，放好等一等，水不热后再喝。','喝水、热、太、还不能、等一等、能','一杯水的单线因果；不补这水太冷了不想喝。','等一等接12并在25回访；不能喝不是不想喝。'],
 [20,'拟换题','豆子去哪了','把豆子放入土中，几天里来看和照料，后来看到豆苗。','豆子、土、豆苗、水、看、长出来','替换给花浇多水主题；以等待后的生长发现为任务，时间经过必须写清，不能一浇就长。','保留完整豆苗，新增辅助字苗明列；长读zhǎng不自动算长短cháng的同词巩固。'],
 [21,'定向小修','小球也要走','试出球在车前/后/里，只有合适放法才能带它一起走。','前、后、里、进去、入口、出口、门外','保持摆放位置导致不同结果；若回访车库，只把最后成功带球的行程写成入/出，不另开支线。','若进出文字使操作过程变长，先保留原6段，并把入口/出口回访标未实现。'],
 [22,'保留主线','小纸片飞了','追随被风吹的纸片，最后用石头压住，解决总要追跑的问题。','红纸、小纸片、飞、左边、右边、跑、压住','保留有用的解决行动；压住完整用词可作情境词，不硬造第二篇压东西。','石头接7，风接5，片飞接2；纸片在28再次成为低难度跳跃目标。'],
 [23,'定向小修','谁先笑','约定不笑、对视，孩子做兔耳把大人逗笑，自己也笑。','眼睛、看着、耳朵、小兔、先、笑、开心','眼睛放对视动作；耳朵放手势；开心只放结果。下一轮若超出现有6段篇幅，优先删显性的开心回访，不延长故事。','眼睛可在25合上眼睛、27比眼睛回访；开心在28成功后回访。不能又加入快乐喜欢爱。'],
 [24,'定向小修','两片西瓜','朋友来家吃水果，孩子把一大一小的两片西瓜按朋友选择分享，双方尝到好吃。','朋友、水果、西瓜、大、小、喜欢、给、真好吃','用朋友来我家吃水果建立分享情境，保留真好吃自然台词，承接原果/真；比较的是两片，不让两个幼儿各抱整瓜吃。','瓜用完整西瓜，辅助字西列出；仅大小关系不冒充多少关系。洗手回访只放吃前真实动作，超长则不加。'],
 [25,'定向小修','谁还在睡','孩子催太阳起来，坐着等时自己又睡了，由爸爸揭晓反差。','日出、太阳、坐下来、等一等、合上眼睛、又睡了','保留刚改主线；若增加合上眼睛，必须是孩子打盹过程，不能改变真实头像表情来补画。','太阳非被呼喊唤出；日出只作情境初见，太阳/月亮不为了三篇配额硬串。'],
 [26,'小修','水中的月亮','兔喝水使倒影散，水静后月亮重现，回应是不是喝掉的误会。','晚、月亮、水中、喝水、动、不动、回来','开场天晚了可承接被17换题移走的晚；保持水面动静的物理因果。','月亮是初见词，后面没有自然夜景则明列下阶段回访，不在画面角落塞月亮算字。'],
 [27,'小修','我和小兔','比较兔与我，看牙时低下头仍看不清，喂菜叶后看到兔的小牙。','耳朵、长、眼睛、牙、低下头、菜叶','低放在有目的的低头动作；耳朵/眼睛由13/23先接触，减少此处同时涌入的新词。','不截耳朵/眼睛/菜叶。短只作耳朵长短的待审候选，不视为已经解决。'],
 [28,'小修','我跳过去了','先跳不过石头，再把目标换成地上纸片，成功后获得信心。','会跳、学、先、过、小石头、小纸片、开心','开心承接真正成功，不为覆盖哭而追加哭闹，不写小纸片低低的。','复用11高、22纸片、23先与开心；学/会/跳仍要如实标晚段接触。'],
 [29,'拟换题','给朋友的生日画','朋友喜欢小火车，孩子画朋友和自己一起玩的小火车画，送上生日祝福。','生日、生日快乐、朋友、喜欢、画、小火车','替换再次给物件画家；画必须回应朋友兴趣，祝福为真实交往，不塞今年明年/全部食物。','保留火车词在有作用的画中，避免替换后火字消失；绿若无自然落点，列潜在丢失，不硬列背景色。'],
 [30,'拟换题','我的新书','拿到一本有多页图的新书，认出上面的名字，又在小鱼故事里发现自己，邀请家人一起看。','一本、新书、名字、小鱼、新家、自己','用真正一本多页书，不把单张画冒称一本；不把29已送朋友的生日画拿回装订。','名字接1、自己接12/16、鱼仍晚段初见；完成的是读到自己的体验，不罗列全级动物。']
];
// 固定题名，避免方案标题延续正在纠正的整瓜表述。
specs[23][2]='两片西瓜';
const additions=[
 {word:'二',story:4,reason:'手指花开/合各配一/二口令。',status:'拟安排'},
 {word:'门外',story:9,reason:'开场车辆在门外，收车与开门形成内外位置。',status:'拟安排'},
 {word:'让',story:9,reason:'让小车回家，服务收车目的。',status:'拟安排'},
 {word:'那',story:10,reason:'找到时指认那是我的小球。',status:'拟安排'},
 {word:'问',story:11,reason:'我问小树谁高。',status:'拟安排'},
 {word:'就',story:12,reason:'水动了，水中的影像就不见了。',status:'拟安排'},
 {word:'很',story:15,reason:'很想睡交代清床的行动目标。',status:'拟安排'},
 {word:'洗手',story:17,reason:'先洗去手上脏污再吃面包；手黑是情节线索。',status:'拟换题'},
 {word:'面包',story:17,reason:'想吃面包触发洗手行动，不另加食物清单。',status:'拟换题'},
 {word:'喜欢',story:18,reason:'出门玩的愿望；24选择西瓜、29生日画回访。',status:'拟安排'},
 {word:'豆子',story:20,reason:'埋入土、等待后看到豆苗。',status:'拟换题'},
 {word:'土',story:20,reason:'豆子放入土中；与植物生长有实际关系。',status:'拟换题'},
 {word:'开心',story:23,reason:'逗笑成功的感受，28成功跳过纸片回访；若23过长则取消此处新增。',status:'拟安排但须审篇幅'},
 {word:'西瓜',story:24,reason:'把原抽象果子具体成可分食的两片西瓜。',status:'拟安排'},
 {word:'低下头',story:27,reason:'为观察小兔的牙而低头，避免人比树低的不自然说法。',status:'拟安排'},
 {word:'生日',story:29,reason:'给朋友作画及祝福的缘由。',status:'拟换题'},
 {word:'生日快乐',story:29,reason:'一次自然的生日祝福；与开心不是同一字词统计。',status:'拟换题'},
 {word:'一本',story:30,reason:'真正一本多页图画书的数量与量词。',status:'拟换题'},
 {word:'新书',story:30,reason:'在新书中认出自己的名字和人物。',status:'拟换题'}
];
const pending=[
 {characters:'他她',kind:'缺少清楚指代的事件',candidate:'可在有两位明确角色的动物或朋友对话中分别承接。每次先说清人物，再用他/她，不能接连换指代。',decision:'暂未指定篇号；不为补字把猫狗硬写成他/她。'},
 {characters:'少',kind:'缺少数量/分量变化',candidate:'真正用餐分量或东西逐渐减少的故事；与多形成可观察的变化。',decision:'24两片瓜只教大小，不能把它算多少；需另一个事件或换题。'},
 {characters:'短',kind:'缺少合适比较物',candidate:'29若保留火车画空间问题，可让火车长、纸太短；与生日画方案互斥，不同时塞。27人耳/兔耳长短也只能作待审候选。',decision:'主方案选择生日画，因此短仍未落实；不恢复长短纸道路、纸桥。'},
 {characters:'哥姐弟妹爷奶',kind:'真实家庭设置条件字',candidate:'只统计选中的真实家庭角色。若要求默认三口版本也覆盖六字，需另写分散的虚构动物家庭故事，明确不是孩子的真实家人。',decision:'保留原目标，标条件/未解决；不能把所有选项的并集当每个孩子都读到，也不在本轮擅加六位家人。'},
 {characters:'哭',kind:'缺少有意义的情感转折',candidate:'受挫后被理解或得到帮助的独立事件，哭应有原因和回应。',decision:'不往28每次失败后硬塞哭，也不为字表制造无故难过。'},
 {characters:'爱',kind:'需要自然的情感表达',candidate:'照顾家人/植物或亲子互动后的表达；第3篇正文不加，不能用一句我爱所有人替代具体事件。',decision:'本轮拟换题20着重等待与生长，未承诺追加爱；仍列缺口。'},
 {characters:'年明',kind:'时间概念需要事件推进',candidate:'明天还要做什么必须有已建立的期待；今年/明年须与年龄或跨年情境相关。',decision:'29生日画只承担生日，不同时塞今年明年；不能把今天天字形出现算明年。'},
 {characters:'冷',kind:'缺少天气影响行动的因果',candidate:'18天冷导致选择衣服，或25天未亮等待时靠近爸爸取暖；只有写成行动才有价值。',decision:'会增加现有反差故事负担，暂列备选；19热水篇不添加冷水支线。'},
 {characters:'牛羊马狗',kind:'动物题材领域缺口',candidate:'需要有明确目标的动物观察/游戏或童话，而非轮流点名。14是较早换题备选位，21是另一处玩车题材备选位。',decision:'主方案仍保留14/21已有有效任务，所以这四字暂未安排；画面背景有动物不算正文覆盖。'},
 {characters:'米饭蛋',kind:'用餐领域仍不全',candidate:'拿早饭、合适分量、共同用餐的真实任务，从其中选少量食物；不把面包/米饭/豆/蛋一起罗列。',decision:'17只教洗手与面包，20教种豆；米饭和蛋仍待有用餐目标的另一个故事。'}
];
// 词路由是具体编辑排布，不是当前正文统计。每项均附本篇作用。
const routes=[
 ['你好',[[1,'相互介绍'],[11,'跟小树打招呼'],[12,'认出水中的自己']],'保留已有','三个自然语境已经有，首复现间隔仍较长。'],
 ['名字',[[1,'自我介绍'],[30,'在新书上认出名字']],'拟回访','只规划两篇且间隔大，不能称足够巩固。'],
 ['什么',[[1,'问对方名字']],'待补回访','保持第1篇，后面尚无自然路由。'],
 ['爸爸',[[3,'家庭介绍'],[18,'催大人准备出门'],[23,'亲子逗笑'],[25,'亲子等日出']],'保留已有','角色以真实设置审稿；不把所有照护者替换选项并集。'],
 ['妈妈',[[3,'家庭介绍'],[17,'洗手时互相提醒的照护者候选'],[30,'一起看新书的照护者候选']],'条件路由','17/30选谁须依实际照护者，不能保证所有配置都有妈妈。'],
 ['小花',[[2,'花片儿歌'],[4,'手指做花'],[6,'为花撑伞']],'保留已有','换题20后不再把原浇花正文算第四次。'],
 ['一',[[2,'花片数量'],[4,'开手口令']],'拟回访','一与两/二分开，不当同字。'],
 ['二',[[4,'合手口令']],'新字拟安排','目前只有一个候选事件，尚无跨篇安排。'],
 ['片',[[2,'花的片数'],[22,'纸片'],[24,'两片西瓜'],[28,'小纸片']],'拟迁移','量词/构词在不同词形里出现，分别记录完整词。'],
 ['小手',[[4,'手指花'],[12,'手触水'],[17,'洗手'],[23,'手做兔耳']],'拟迁移','从开合到操作、清洁与象征动作。'],
 ['开',[[4,'张开手指花'],[6,'伞开'],[9,'开车入库'],[23,'开心（不同词义）']],'保留并扩展','开手/开伞/开车/开心不是同一个词，字形次数不能代替各词掌握。'],
 ['白云',[[5,'白云遮山']],'情境初见','完整白云目前只在5；12是云，不把两者当同词统计。'],
 ['云',[[5,'遮山'],[12,'水中倒影']],'保留已有','同一云字已在两篇；白云整词另计，第12篇勿删掉原有天空倒影观察。'],
 ['风',[[5,'云被吹走'],[22,'纸片被吹走']],'保留已有','间隔长，仍标需要后续回访。'],
 ['不见',[[2,'花片飞入草丛'],[4,'合手花不见'],[5,'云遮山'],[12,'水动影散'],[26,'水动月影散']],'保留已有','不同原因产生同一观察结果。'],
 ['石头',[[7,'放回家'],[8,'误认草的所在'],[11,'垫高脚下'],[22,'压纸片'],[28,'比较跳跃难度']],'保留已有','8原文为石头，其余多为小石头；此处只统计石头整词。同类道具多种有作用的语境。'],
 ['拿',[[7,'拿石头'],[12,'拿出手'],[15,'拿下玩具'],[21,'拿回小车'],[22,'拿回纸片']],'保留已有','拿起/拿出/拿下/拿回分别保留完整搭配。'],
 ['放',[[7,'放回石头'],[12,'手放入水'],[15,'放好玩具'],[20,'豆子放入土'],[21,'放球比较位置']],'拟迁移','不可用标题或小结来补正文次数。'],
 ['回家',[[7,'石头和我各回原处'],[9,'收小车']],'保留已有','家字与回家整词独立统计；不把题名或自我介绍当家字出现。'],
 ['小虫',[[8,'误认卷草']],'情境初见','不硬加到后面点名；下阶段再安排真正虫的观察故事。'],
 ['入口',[[9,'车从入口进入'],[21,'成功载球后从入口进车库（候选）']],'拟回访','21若因篇幅取消，此词仍只有9一篇。'],
 ['出口',[[9,'车从出口出来'],[21,'载球从出口出来（候选）']],'拟回访','与入口成对但两个完整词分别计。'],
 ['门外',[[9,'车入库前位置'],[21,'车载球出库的位置（候选）']],'拟安排','新外字有行动承接；取消车库回访时仍需另找机会。'],
 ['让',[[9,'让小车回家']],'新字拟安排','仅一个拟句落点，不能称跨篇够。'],
 ['小车',[[9,'入库收车'],[10,'找球的位置参照'],[13,'鸟最后来到的地方'],[15,'清床'],[21,'带球走']],'保留已有','多篇保留但每篇任务必须不同。'],
 ['小球',[[10,'寻找'],[14,'推球邀猫玩'],[15,'清床'],[21,'前后里比较']],'保留已有','球由孩子推/拿/放，不自己无因来去。'],
 ['那',[[10,'找到后指认球']],'新字拟安排','不等同于这，后续路线未锁定。'],
 ['后',[[10,'查看车后和门后'],[21,'球在车后没有跟着走']],'保留已有','纸片左/右属于不同位置词，不混计为后。'],
 ['问',[[11,'向小树问谁高'],[27,'问小兔牙在哪（拟将动作说清）']],'拟安排','问号本身不算问字出现。'],
 ['高',[[11,'站位改变比较'],[28,'石头作为过难目标']],'保留已有','低另有低头动作，不能把高低当已双覆盖。'],
 ['水中',[[12,'自己的倒影'],[26,'月亮倒影'],[30,'新书中的小鱼场景（拟保留）']],'拟迁移','30必须有相关正文，背景水面不计。'],
 ['就',[[12,'水动导致影像散的结果句']],'新字拟安排','只一个因果场景，不追加无作用的就。'],
 ['自己',[[12,'认出倒影'],[16,'自己穿好鞋'],[30,'在书里发现自己']],'拟前置并回访','完整自己不截词；自/己是辅助字。'],
 ['等一等',[[12,'等水静'],[19,'等水温适合'],[25,'等太阳']],'保留已有','等待的三个原因不同，不等于父母重读三次。'],
 ['耳朵',[[13,'听声找来源'],[23,'用手模仿兔耳（候选）'],[27,'比较真兔与自己']],'拟前置并回访','23优先保6段；若不加入耳朵，只有13/27两次。'],
 ['听',[[13,'循声寻找'],[27,'和兔一起听鸟']],'保留已有','耳朵被画出不等于听字出现。'],
 ['小鸟',[[13,'叫声来源且换位置'],[27,'提供听觉观察']],'保留已有','替换17后不再计睡前鸟；需后续再见。'],
 ['小猫',[[13,'另一叫声来源'],[14,'玩滚动球'],[15,'清床睡觉']],'保留已有','不同生活/游戏任务保留三处。'],
 ['红',[[14,'红球'],[22,'红纸片'],[25,'天边变红'],[27,'兔眼红（具体白兔）']],'保留已有','红眼应对应当前白兔，不能宣称所有兔都红眼。'],
 ['黄',[[14,'黄球']],'待补回访','目前无其他真实颜色任务，不凭空加黄太阳。'],
 ['推',[[14,'推球引猫'],[21,'推车比较球的位置']],'保留已有','推为现有辅助字，仍登记。'],
 ['很',[[15,'猫很想睡']],'新字拟安排','不在每篇结尾机械加很开心。'],
 ['床',[[15,'清空猫床']],'回访受换题影响','17替换后床从原来两篇降为一篇，必须回查，不能只看新增字。'],
 ['睡',[[15,'猫能上床睡'],[18,'大人还没起'],[25,'孩子等太阳睡着']],'保留已有','删去17后仍有不同主体/原因的睡。'],
 ['穿鞋',[[16,'自己换合脚鞋'],[18,'穿好等大人']],'拟回访','目前16不含连续穿鞋，下一轮完整词统计须按实句重算；词义路线不冒称字符串命中。'],
 ['衣服',[[18,'为出门穿衣']],'情境初见','不能截成衣；冷支线未选，先不制造多次换衣。'],
 ['洗手',[[17,'自己洗并提醒大人'],[24,'吃瓜前（候选）'],[27,'喂兔后（候选）']],'新词拟安排','24/27若超长先取消句子，三处不是硬承诺。'],
 ['面包',[[17,'触发先洗手的愿望']],'新词拟安排','先按初见处理，米饭/蛋不搭车塞进17。'],
 ['黑',[[17,'手黑提示洗手'],[25,'日出前天黑'],[27,'我的眼睛黑']],'拟前置并回访','物体颜色与天色是不同词语情境。'],
 ['喜欢',[[18,'喜欢出门玩'],[24,'朋友选择喜欢的瓜片'],[29,'画朋友喜欢的小火车']],'新词拟安排','必须先有具体对象；不把喜欢=爱=快乐混作同词覆盖。'],
 ['喝水',[[19,'等热水适温'],[26,'兔喝水引出月影变化']],'回访受换题影响','20种豆不再把原小花喝水词算作第三篇。'],
 ['热',[[19,'热到暂时不能喝']],'情境初见','有原因有结果，一篇真实理解优先；冷仍未安排。'],
 ['豆子',[[20,'土里等待生长']],'新词拟安排','食物豆与种植豆可关联，但不在同一篇硬加煮豆吃饭。'],
 ['土',[[20,'植物生长的地方']],'新字拟安排','小苗在土里出芽，不等同土山/土地所有用法掌握。'],
 ['豆苗',[[20,'数日后可见的新生长']],'新辅助词拟安排','苗为新辅助字，需亲子领读；未默认批准扩大原200字表。'],
 ['长',[[20,'豆苗长出来：zhǎng'],[27,'耳朵长：cháng']],'多音分开','两种读音与词义分别记录；不能标为同词跨篇巩固。'],
 ['左边',[[22,'追纸片向左']],'情境初见','只此篇，后续真实空间任务再回访。'],
 ['右边',[[22,'追纸片向右']],'情境初见','不能把同篇左右轮流多次当跨篇。'],
 ['小纸片',[[22,'受风影响并被固定'],[28,'更容易的跳跃目标']],'保留已有','两个用途自然迁移；并非纸桥承重。'],
 ['眼睛',[[23,'对视不许笑'],[25,'等候中合上眼睛'],[27,'比较眼睛颜色']],'拟前置并回访','整词含辅助睛；不得为配图重绘真实脸部表情。'],
 ['先',[[23,'爸爸先笑'],[28,'先选小目标']],'保留已有','当前辅助字，字形与两种次序语境分开说明。'],
 ['开心',[[23,'逗笑成功（篇幅允许）'],[28,'自己成功跳过去']],'新词拟安排','只规划两处；不是已有掌握标准，不附加快乐清单。'],
 ['朋友',[[24,'尊重选择并分享'],[29,'了解兴趣、为朋友画生日画']],'拟回访','计划两处；朋友来过/拿礼物等可视为同事件，不算多篇。'],
 ['水果',[[24,'朋友来家分享水果的情境']],'保字拟安排','以正常完整词承接果，不在瓜故事中悄悄丢掉原目标果；水果与果子分别计完整词。'],
 ['真好吃',[[24,'双方吃瓜后的自然回应']],'换词中保留','现稿24已有此完整搭配，拟改水果后仍保留，真不能无意丢失。'],
 ['西瓜',[[24,'分食两片一大一小']],'新词拟安排','西为辅助字；整瓜/切片画文必须一致。'],
 ['日出',[[25,'等待的具体事件']],'情境初见','保留有趣反差，不写明天还来替本词凑回访。'],
 ['太阳',[[25,'真实日出']],'情境初见','阳为既有辅助字；不在生日画/新书里无因塞太阳。'],
 ['晚',[[26,'夜里观察月影的开场']],'补偿换题丢字','17原唯一晚字移走，26天晚了是自然补回位置。'],
 ['月亮',[[26,'水中倒影消失又回']],'情境初见','亮为辅助字；下一阶段有夜间事件再回访，本级不宣称三篇。'],
 ['低下头',[[27,'为看兔牙低头']],'新词拟安排','低是动作方位，不写身高比较我比树低。'],
 ['牙',[[27,'喂菜后看到小兔牙']],'情境初见','保持情节发现，不仅列身体部位名单。'],
 ['菜叶',[[27,'兔吃东西露出牙的原因']],'情境初见','叶为辅助字，不能省成片菜凑字表。'],
 ['跳',[[28,'由过难目标转向可完成目标']],'情境初见','会/学也晚，下一阶段安排真实游戏回访。'],
 ['生日',[[29,'给朋友作画的缘由']],'新词拟安排','生日与日出包含同日字，但不是同词。'],
 ['生日快乐',[[29,'作画送祝福']],'新词拟安排','一个自然祝福已可成立；乐首次接触，不能宣称三篇。'],
 ['小火车',[[29,'朋友喜欢、生日画的主体']],'换题中拟保留','火仅以火车构词接触，不等于认识火焰；晚段首次须下阶段衔接。'],
 ['画',[[29,'画朋友与自己共同玩的画']],'回访受换题影响','30改为读新书，不再保留原画画动词；须另找真实绘画任务或明确本级初见。'],
 ['一本',[[30,'真实一本多页书']],'新词拟安排','本为量词；不得用一片画叫一本书。'],
 ['新书',[[30,'书中有自己的名字和小鱼故事']],'新词拟安排','书/本属于晚段初见，下阶段需先回访阅读活动。'],
 ['小鱼',[[30,'在书中的水边场景发现自己']],'情境初见','不在13叫声或26月影支线硬加鱼。'],
 ['新家',[[30,'书中小鱼有家、我也在画里']],'换题中拟保留','若下轮完整稿只剩书而无小鱼的家，不能继续沿用新家路线。']
].map(([term,steps,status,note])=>({term,status,note,steps:steps.map(([story,purpose])=>({story,purpose,existsAsExactStringInCurrentBody:actualFor(term).includes(story),proposedOnly:true})),actual:{storyNumbers:actualFor(term),occurrences:manuscript.books.reduce((n,b)=>n+b.paragraphs.reduce((a,p)=>a+p.split(term).length-1,0),0)}}));

const seen=new Set();
const books=manuscript.books.map((b,i)=>{
 const s=specs[i];assert.equal(s[0],b.number);
 const chars=han(body(b)),fresh=unique(chars).filter(c=>!seen.has(c));chars.forEach(c=>seen.add(c));
 const relevant=routes.filter(r=>r.steps.some(x=>x.story===b.number));
 return {number:b.number,oldNumber:b.oldNumber,currentTitle:b.title,proposedTitle:s[2],decision:s[1],storyTask:s[3],focusWords:s[4].split('、'),implementation:s[5],limits:s[6],protectedBody:protectedNumbers.includes(b.number),current:{hanCount:chars.length,paragraphs:b.paragraphs.length,firstSeenCharacters:fresh,firstSeenTargetCharacters:fresh.filter(c=>plan.characters.includes(c)),firstSeenAuxiliaryCharacters:fresh.filter(c=>!plan.characters.includes(c))},plannedNewMissingTargetCharacters:unique(additions.filter(a=>a.story===b.number).flatMap(a=>han(a.word))).filter(c=>audit.missing.includes(c)),wordRoutes:relevant.map(r=>({term:r.term,currentStories:r.actual.storyNumbers,plannedStories:r.steps.map(s=>s.story),status:r.status,roleHere:r.steps.find(x=>x.story===b.number).purpose,laterPlannedStories:r.steps.filter(x=>x.story>b.number).map(x=>x.story)})),newTextWritten:false,artGenerated:false};
});
const assignedMissing=unique(additions.flatMap(a=>han(a.word))).filter(c=>audit.missing.includes(c));
const unresolvedMissing=audit.missing.filter(c=>!assignedMissing.includes(c));
assert.equal(assignedMissing.length+unresolvedMissing.length,43);
assert.deepEqual(new Set(pending.flatMap(p=>han(p.characters))),new Set(unresolvedMissing));
const missingRegister=audit.missing.map(c=>{
 const a=additions.filter(a=>a.word.includes(c)),p=pending.find(p=>p.characters.includes(c));
 return {character:c,actualOccurrences:0,actualStories:[],status:a.length?'有拟议场景，正文未改':'未解决/条件目标',proposals:a,pending:p||null};
});
const targetRows=audit.targetRows.map(r=>{
 const relevant=routes.filter(w=>w.term.includes(r.term));
 const missing=missingRegister.find(m=>m.character===r.term);
 let disposition=missing?(missing.proposals.length?'缺字：有拟议事件，未实施':'缺字：未解决/条件目标'):(r.distinctStories>=3?'当前跨≥3篇：继续自然调用，不表示掌握':r.distinctStories===2?'当前仅2篇：回访/衔接需审':'当前仅1篇：优先补回访或标情境初见');
 return {character:r.term,actual:{occurrences:r.totalOccurrences,distinctStories:r.distinctStories,storyNumbers:r.storyNumbers,firstStory:r.firstStory,nextStory:r.nextStory},disposition,plannedWordForms:relevant.map(w=>({term:w.term,stories:w.steps.map(x=>x.story),status:w.status,note:w.note})),missingResolution:missing||null};
});
const replacementRisks=[...replacements,24].sort((a,b)=>a-b).map(n=>{
 const b=manuscript.books.find(b=>b.number===n),uniqueHere=audit.targetRows.filter(r=>r.distinctStories===1&&r.firstStory===n).map(r=>r.term);
 return {story:n,currentTitle:b.title,proposedTitle:books[n-1].proposedTitle,currentTargetCharactersOnlyHere:uniqueHere,decision:n===17?'晚→26；床失去17这次复现，睡仍15/18/25。':n===20?'当前无首次目标字；会丢失一次小花/喝水回访。多将仅余2篇儿歌、点仅余11；当前仅20有的流/湿/加辅助字可随旧事件退出，须登记。土/豆新增带来苗辅助字。':n===24?'果→拟保留完整词水果；真→保留真好吃；朋友拟29回访，子由20豆子接续。这些都是计划，不能先算净新增瓜字。':n===29?'火车在生日画中保留才保住火；绿没有自然落点则仍是替换风险。画的后续复现受30换题影响。':'原小鱼/新家/自己须在新书故事内有正文落点；条当前只此篇，若不再画一条鱼，条会丢失。哪若不保留提问，将从10/30降为仅10。'};
});
const recurrenceRiskScreen=audit.targetRows.filter(r=>r.distinctStories>=2).map(r=>({character:r.term,currentStories:r.storyNumbers,storiesWithoutFourOriginalTexts:r.storyNumbers.filter(n=>!replacements.includes(n))})).filter(r=>r.storiesWithoutFourOriginalTexts.length<=1);
const scarceWithoutDedicatedRoutes=targetRows.filter(r=>r.actual.distinctStories>0&&r.actual.distinctStories<=2&&!r.plannedWordForms.length).map(r=>({character:r.character,stories:r.actual.storyNumbers,decision:'尚无专门回访路由。数词/年龄/班级按父母领读与实际设置；其余需下轮自然句中安排，不宣称已经巩固。'}));
const notes=[
 '这是30篇共同编排方案，不是新定稿。未替换30篇正文、未修改原200字表、未同步书架、未出图、未生成PDF。',
 '原200字目标原样保留，未改成小羊上山60字。覆盖与复现使用当前三口家庭示例的正文；姓名占位符、标题、字表卡、小结、图片都不计正文覆盖。',
 '本轮给缺字安排的是可审阅的事件落点，不把拟安排词语算作已经使用。未写完整新稿，不能预测改后真实字数、生字数、覆盖率或复现达标。',
 '编辑优先：每篇有孩子能理解的目标/观察/游戏和结果；再控制正常完整词、句式、新字及后续调用。不先列缺字再硬编事件。',
 '熟词应称已见词，不代表孩子已经掌握。同篇5次仍只算1篇；跨3篇只是编辑安排参照，不是用户已确认的掌握线。',
 '保留第1、2篇父母领读定位；第3篇维持已删数数旁白的简稿，按真实家庭选项；第5—7篇只保持已确认顺序，正文不改。',
 '拟重点换题17/20/29/30。其他篇保持主线，可选择少量替换句；23不增加到超过现有6段篇幅，眼睛/耳朵/开心三项若太挤就取消部分词路由。',
 '当前辅助字23个不是错误名单。耳朵、眼睛、太阳、月亮、自己、衣服等保留正常词；新候选豆苗/西瓜会带来苗/西两个当前正文未见的辅助字，需明列而不暗改200字表。',
 '替换题材可能丢掉旧字与回访。新增词清单不能直接相加当改后覆盖，必须以完整改稿重算；尤其晚、床、多、点、哪、喝水、画、火、绿、条，以及24的果/真。',
 '多音/多义单列：长出来zhǎng与耳朵长cháng不是同词复现；火车中的火不算火焰概念；不同配置的亲属/年龄不合并统计。',
 '太阳、月亮、小鱼、书等若仍只在尾段初见，要明确下阶段第一批故事的回访任务，不能宣称本级已反复巩固。',
 '页面分镜和A5排版在文案确认后做。当前分段不等于打印页码；保持同幅图与对应文字在一页的约束，但本轮未输出任何新绘本画面。'
];
const summary={date:'2026-10-25',kind:'editorial-plan-not-manuscript',books:30,targetCharacters:200,currentBody:{...audit.summary},recommendedReplacements:replacements,protectedBodies:protectedNumbers,missing43WithProposedEvents:assignedMissing.length,proposedMissingCharacters:assignedMissing.join(''),missingStillUnresolved:unresolvedMissing.length,unresolvedMissingCharacters:unresolvedMissing.join(''),plannedCoverageIsNotActualCoverage:true,manuscriptChanged:false,originalCharacterListChanged:false,illustrationsGenerated:0,pdfsGenerated:0};
assert.equal(books.length,30);assert.equal(targetRows.length,200);assert.equal(new Set(targetRows.map(r=>r.character)).size,200);
assert.equal(new Set(books.map(b=>b.oldNumber)).size,30);assert.equal(seen.size,180);assert.equal(books.reduce((n,b)=>n+b.current.hanCount,0),1578);
assert.equal(routes.length,new Set(routes.map(r=>r.term)).size);
for(const r of routes){assert.equal(r.steps.length,new Set(r.steps.map(s=>s.story)).size);for(const s of r.steps){assert(s.story>=1&&s.story<=30);if(protectedNumbers.includes(s.story))assert(s.existsAsExactStringInCurrentBody,`${r.term}不能加到受保护第${s.story}篇`);}}
for(const r of routes.filter(r=>r.status==='保留已有'))for(const s of r.steps)assert(s.existsAsExactStringInCurrentBody,`保留已有误标：${r.term} 第${s.story}`);
for(const c of assignedMissing)assert(plan.characters.includes(c));
for(const input of inputs)assert.equal(sha(input.file),input.sha256,'输入文件不应变更');
const data={summary,notes,books,wordRoutes:routes,missingRegister,targetRows,replacementRisks,recurrenceRiskScreen,scarceWithoutDedicatedRoutes,auxiliaryExitCandidates:[{characters:'流湿加',story:20,reason:'仅原浇花湿脚事件有，换题后可以随旧事件退出，不为保字恢复无关情节。'}],newAuxiliaryCandidates:[{word:'豆苗',character:'苗',story:20,reason:'植物生长任务，不能截词隐藏辅助字。'},{word:'西瓜',character:'西',story:24,reason:'明确可分食水果，不能只为省字写不清楚的果子。'}],pendingThematicDecisions:pending,unchangedInputs:inputs};
const save=(file,text)=>fs.writeFileSync(path.join(out,file),text+'\n','utf8');
save('30篇故事与字词复现编排方案.json',JSON.stringify(data,null,2));
const list=a=>a.length?a.join('、'):'无';
const report=['第一级30篇：故事任务、完整词语与回访共同编排表（方案，非改稿）','日期：2026-10-25','',...notes.map((n,i)=>`${i+1}. ${n}`),'','当前实数与方案边界',`当前正文：30篇、1578字次、180个不同汉字；原200字覆盖157，缺43；另有23个辅助字。`, `43个缺字中，${assignedMissing.length}字已有拟议事件；${unresolvedMissing.length}字仍未解决/取决于家庭配置。此处不是改后覆盖${157+assignedMissing.length}字。`, `拟议落点：${assignedMissing.join('、')}`,`仍需事件或主题选择：${unresolvedMissing.join('、')}`,'','30篇逐篇编排'];
for(const b of books){report.push('',`【新${b.number}／原${b.oldNumber}】${b.currentTitle.replaceAll('CHILD','小石头')}${b.currentTitle!==b.proposedTitle?' → 拟题《'+b.proposedTitle+'》':''}｜${b.decision}`,`故事任务：${b.storyTask}`,`编排重点词（不等于全是新增）：${b.focusWords.join('、')}`,`改动边界：${b.implementation}`,`回访与风险：${b.limits}`,`现稿基线：${b.current.hanCount}字，${b.current.paragraphs}段；按现顺序首次见字${list(b.current.firstSeenCharacters)}。这不是修改后的生字量。`,`拟补的原字表缺字：${list(b.plannedNewMissingTargetCharacters)}。`,'相关字词路线（括号为本篇作用，篇号均是规划；标为候选的仍需完整稿审读）：');for(const w of b.wordRoutes)report.push(`  ${w.term}：${w.plannedStories.join('→')}；本篇${w.roleHere}；后续${list(w.laterPlannedStories)}；${w.status}`);}
report.push('','换题后的旧字丢失与回访风险',...replacementRisks.map(r=>`${r.story}《${r.currentTitle}》→《${r.proposedTitle}》：现稿仅此篇目标字${list(r.currentTargetCharactersOnlyHere)}。${r.decision}`),'','四篇原文被替换时的复现风险筛查（未将新句补回，非改后统计）',...recurrenceRiskScreen.map(r=>`${r.character}：当前${r.currentStories.join('、')}；若四篇旧句全退出，仅余${list(r.storiesWithoutFourOriginalTexts)}。请用完整新稿回查。`),'','现稿低复现且尚无专门词路由的目标字',...scarceWithoutDedicatedRoutes.map(r=>`${r.character}：现稿${r.stories.join('、')}。${r.decision}`),'','尚未解决的题材/词义任务',...pending.flatMap(p=>[`${p.characters}｜${p.kind}`,`候选事件：${p.candidate}`,`本轮处理：${p.decision}`]),'','下一轮改稿验收顺序','先按本篇任务写成自然短稿，再通读主体/指代/动作原因/结局；同题只选一个主任务。','以本轮最新完整30篇为基线逐篇对照，不恢复已撤回v9，不把主题更换说成只改次序。','改一篇就重算原200目标覆盖、全部正文实际字、辅助字、完整词串频次和跨篇回访，并检查被删词。','第23篇不扩长；豆苗必须经过时间；瓜按切片；书必须真实多页；人物手势、真实头像和插画对应在文案确认后另检。','本表没有宣布30篇定稿，也没有宣布200字已覆盖或任何生字已掌握。');
save('30篇共同编排表-供审阅.txt',report.join('\n'));
save('30篇编排总览.txt',['30篇编排总览（编辑方案，正文未改）','每篇先有任务和结果，再安排字词；下面的词是编排重点，不等于全是新增生字。','保留1/2、3及5—7正文；17/20/29/30拟换题。实际仍是原200字已用157、缺43。','',...books.flatMap(b=>[`${String(b.number).padStart(2,'0')}（原${b.oldNumber}）《${b.proposedTitle.replaceAll('CHILD','小石头')}》｜${b.decision}`,`  任务：${b.storyTask}`,`  字词：${b.focusWords.join('、')}`,`  回访/边界：${b.limits}`,'']),'缺字方案：21字有拟议事件，22字仍未解决/取决于家庭配置；不把此表当200字已覆盖。','四篇换题、13/23/25词形前置都要在完整短稿中审读；23不扩长。','完整逐词篇号见《完整词语跨篇路线.txt》，风险与原稿对照见《30篇共同编排表-供审阅.txt》。'].join('\n'));
save('43个缺字的安排与未解决项.txt',['43个缺字：实际均为0次，以下仅为编辑安排','',...missingRegister.flatMap(r=>[`${r.character}｜${r.status}`,r.proposals.length?r.proposals.map(p=>`  第${p.story}：${p.word}；${p.reason}【${p.status}】`).join('\n'):`  ${r.pending.candidate}\n  ${r.pending.decision}`])].join('\n'));
save('完整词语跨篇路线.txt',['完整词语与常用搭配跨篇路线（编辑方案）','当前正文次数为字符串独立检索，可重叠，不能相加当总词数。拟路线不算当前次数；“穿鞋”等语义路线可尚未形成连续字符串，均如实列出。','',...routes.flatMap(r=>[`${r.term}｜${r.status}`,`  当前：${r.actual.occurrences}次，${r.actual.storyNumbers.length}篇，篇号${list(r.actual.storyNumbers)}`,`  方案：${r.steps.map(s=>`${s.story}（${s.purpose}）`).join(' → ')}`,`  限制：${r.note}`])].join('\n'));
save('原200字逐字处理表.txt',['原200字逐字处理表：现稿实数／方案词形／未解决项','原字表未删改。现稿数据只计正文；方案路线不能算已覆盖。','',...targetRows.flatMap(r=>[`${r.character}｜现稿${r.actual.occurrences}次／${r.actual.distinctStories}篇／篇号${list(r.actual.storyNumbers)}｜${r.disposition}`,r.plannedWordForms.length?'  词形路线：'+r.plannedWordForms.map(w=>`${w.term}［${w.stories.join('→')}；${w.status}］`).join('；'):'  尚无专门词路由；若现稿覆盖较多则随自然句式调用，否则待回访设计。',r.missingResolution&&!r.missingResolution.proposals.length?'  未解决：'+r.missingResolution.pending.decision:''])].join('\n'));
save('先看这里-编排方案说明.txt',['30篇共同编排方案已整理，正文尚未更换','',`实际基线：原200字，现稿157字已出现、43字未出现，另有23个辅助字；不能把计划当结果。`,`本轮：保留1/2、3及5—7正文；提出17/20/29/30四篇换题，逐篇列了故事任务、重点完整词、前后回访和副作用。`,`43个缺字中${assignedMissing.length}字有了具体事件建议，${unresolvedMissing.length}字仍标未解决或家庭条件目标。没有把暂缺字偷偷从200表里删除。`,'','先读《30篇共同编排表-供审阅.txt》；重点看17/20/29/30换题是否值得，以及13/23/25小修的篇幅负担。','再读《43个缺字的安排与未解决项.txt》；其中家庭六字、动物四字、米饭蛋等需要真正的新故事任务，不能硬塞。','《完整词语跨篇路线.txt》列逐词当前实际次数和拟出现篇号；《原200字逐字处理表.txt》保留每字现稿频次。','结构化数据见同目录JSON。','',...notes].join('\n'));
save('编排方案校验.json',JSON.stringify({passed:true,books:books.length,oldNumbersUnique:new Set(books.map(b=>b.oldNumber)).size,targetRows:targetRows.length,wordRouteEntries:routes.length,missingTotal:43,missingProposed:assignedMissing.length,missingUnresolved:unresolvedMissing.length,protectedRouteInsertions:0,unchangedInputs:inputs,notVerified:['尚无新完整正文，未进行修改后全量覆盖/字频验收。','未制作插画/PDF，未做网页或打印验证。'],outputs:fs.readdirSync(out).filter(n=>n.endsWith('.txt')||n.endsWith('.json'))},null,2));
console.log(JSON.stringify({out,summary,routeCount:routes.length,inputHashesUnchanged:true},null,2));
