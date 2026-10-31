'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const canonical=path.join(root,'output/manuscript-level1-complete-review');
const baseline=path.join(root,'output/level1-manuscript-implemented-20261026/baseline');
const name='第一级30篇完整文案-待确认';
const history=path.join(canonical,'history/rollback-before-coverage-20261026');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const source=JSON.parse(fs.readFileSync(path.join(baseline,name+'.json'),'utf8'));
assert.equal(source.books.length,30);
assert.equal(sha(path.join(baseline,name+'.json')),'1a162eb2644c09199ff44e3bb5c01f44203072c331d2eb9ed4cd30cc467620ca');
assert.equal(source.books[3].title,'我的小手');
assert.equal(source.books[14].title,'小猫的床');
assert(!source.books[3].paragraphs.join('').includes('爱心'));
assert(!source.books[3].paragraphs.join('').includes('二'));
fs.mkdirSync(history,{recursive:true});
for(const ext of ['json','txt']) {
 const current=path.join(canonical,name+'.'+ext);
 const snapshot=path.join(history,'回退前-'+name+'.'+ext);
 if(!fs.existsSync(snapshot))fs.copyFileSync(current,snapshot);
 fs.copyFileSync(path.join(baseline,name+'.'+ext),current);
 assert.equal(sha(current),sha(path.join(baseline,name+'.'+ext)));
}
const withdrawn=[
 'output/level1-manuscript-implemented-20261026',
 'output/level1-child-centered-review-20261026',
 'output/level1-natural-story-plan-20261026'
];
const withdrawal='已撤回｜2026-10-26\n用户要求全部恢复到补字改稿前。此目录中的正文、试排、方案、字数和复现达标结论均为撤回的历史内容，不得作为当前采用稿或继续出图的依据。\n当前恢复稿：'+path.join(canonical,name+'.json')+'\n未经新的明确修改要求，不得重新应用此处改稿或重跑旧脚本覆盖当前稿。\n';
for(const relative of withdrawn)fs.writeFileSync(path.join(root,relative,'已撤回-请勿采用.txt'),withdrawal,'utf8');
const note=[
 '当前文案状态｜2026-10-26：已按用户要求整体回退',
 '恢复基线：2026-10-25第4轮、补字及复现改稿前的30篇完整文案。',
 '第4篇恢复为原《我的小手》六句，不含后来加入的一、二、兔耳或爱心。第15篇恢复《小猫的床》。',
 '2026-10-26为追求覆盖复现形成的三轮改稿与试排已撤回，相关目录有撤回标记。',
 '用户本次对第3篇及第11篇给出的具体想法已单独记录；依照本条消息最后的整体回退要求，本次没有将它们夹带进恢复稿。',
 '不自动改写其他篇目；不出图；未改动阅读应用或PDF。',
 '错误原因：把覆盖数字置于故事与难度之前；擅自修改未要求修改的篇目；未在交付前发现指代、动作与动机断裂。',
 '后续若恢复修改，应从此稿开始，执行用户明确指定的修改范围；逐句检查人物、动作、因果、结尾，再统计字频。',
 '恢复稿JSON SHA256：'+sha(path.join(canonical,name+'.json')),
 '恢复稿TXT SHA256：'+sha(path.join(canonical,name+'.txt'))
].join('\n')+'\n';
fs.writeFileSync(path.join(canonical,'本次修订说明-20261026.txt'),note,'utf8');
fs.writeFileSync(path.join(history,'用户本次明确意见-未应用.txt'),[
 '2026-10-26用户意见记录。仅记录，未应用；本次执行最后的“全部恢复成修改之前的”要求。',
 '第3篇用户原话：我家有几口人，这是爸爸，这是妈妈，有两口人，不对，把我自己忘了，有三口人！',
 '第4篇：恢复原稿，不擅自强改或加生字。',
 '第8篇：否定把虫与草混淆的情节。',
 '第10篇：否定无作用的新球设定、狗叫却找猫等叙事安排，以及无谓增加生字。',
 '第11篇：建议至少加一句“明年我还要和小树比高高！”',
 '第12篇：质疑看鱼与看自己的主线混杂。',
 '第13篇：否定把鸟叫误写为哭声。',
 '第14篇：否定把纸上小鱼与球的偏好做成猫的选择。',
 '第15篇：本轮豆子鸡蛋米饭水果版全部撤回。',
 '最终指令：后面不看，文案全部恢复成修改之前的。'
].join('\n')+'\n','utf8');
const record={date:'2026-10-26',status:'restored-before-coverage-rewrites',canonical:path.join(canonical,name+'.json'),baseline:path.join(baseline,name+'.json'),
 restoredBooks:30,baselineSha256:sha(path.join(baseline,name+'.json')),restoredSha256:sha(path.join(canonical,name+'.json')),
 withdrawnDirectories:withdrawn,productionChanged:false,illustrationsGenerated:0,pdfsGenerated:0,newUserWordingApplied:false};
fs.writeFileSync(path.join(canonical,'当前版本与撤回记录-20261026.json'),JSON.stringify(record,null,2)+'\n','utf8');
console.log(JSON.stringify({restoredBooks:30,restoredByteForByte:true,fourth:source.books[3].paragraphs,fifteenth:source.books[14].title,withdrawnDirectories:withdrawn},null,2));
