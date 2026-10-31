'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const workspace = path.resolve(__dirname,'..');
const root = path.join(workspace,'little-protagonist');
const output = path.join(workspace,'output/manuscript-revision-v9');
const sourceFile = path.join(root,'content/level1-stories-revision-v9-awaiting-review.json');
const baselineFile = path.join(root,'content/level1-stories-reviewed-30.json');
const baseline = JSON.parse(fs.readFileSync(baselineFile,'utf8'));
const texts = require('./manuscript-v9-texts.cjs');
const audit = JSON.parse(fs.readFileSync(path.join(workspace,'output/manuscript-audit/30篇版本与采用文案-证据.json'),'utf8'));
const sha = file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const escape = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const display = s=>s.replaceAll('CHILD','小石头');
assert.equal(texts.length,30);
assert.deepEqual(texts.map(b=>b.number),Array.from({length:30},(_,i)=>i+1));
for(const b of texts){
  assert.ok(b.title&&b.paragraphs.length&&b.changes.length,b.number+': complete text and changes');
  assert.ok(b.paragraphs.every(p=>typeof p==='string'&&p.trim()===p&&p.length>0),b.number+': no empty prose');
  const text=b.paragraphs.join('');
  assert.equal((text.match(/“/gu)||[]).length,(text.match(/”/gu)||[]).length,b.number+': paired dialogue marks');
}
const forbidden=['大果子来','大果子去','花盆给我洗脚','小手关','一岁了吧'];
for(const phrase of forbidden)assert.ok(!texts.some(b=>b.paragraphs.join('').includes(phrase)),phrase+': removed');
const books = texts.map(b=>{
  const old=baseline.books.find(o=>o.number===b.number);
  return {id:'proposed-v9-'+String(b.number).padStart(2,'0'),number:b.number,sourceNumber:old.sourceNumber,
    title:b.title,previousTitle:old.title,form:b.form,paragraphs:b.paragraphs,changes:b.changes,
    personalization:b.personalization||[],reviewStatus:'awaiting-user-confirmation',userDecision:null};
});
const candidate={
  title:'第一级30篇文案·本轮修订第1版（待确认）',
  edition:'level1-proposed-v9-natural-story-first',
  status:'text-draft-awaiting-user-review',
  createdDate:'2026-10-24',
  approval:{status:'awaiting-user-confirmation',confirmedBooks:[],history:[]},
  basedOn:{file:'content/level1-stories-reviewed-30.json',edition:baseline.edition,sha256:sha(baselineFile),
    auditFile:'output/manuscript-audit/30篇版本与采用文案-证据.json'},
  principles:['句子自然，角色、物品与动作指向清楚。','先把故事讲通，不按识字配额或固定页数填句子。','原有重复可以服务互动或笑点，不为清空字表另编情节。','本稿全部等待用户确认；确认前不出图、不替换当前书架或已有PDF。'],
  example:{name:'小石头',age:5,className:'大班',family:['爸爸','妈妈','孩子']},
  paragraphPolicy:'paragraphs是本次审阅的阅读节奏分段，不是A5印刷页码；定稿后再分镜和排版。',
  personalizationPolicy:'CHILD为姓名占位；年龄、班级及家庭称谓当前使用示例文字。用户确认正文后，再核对实际设置的适配文本；未复用旧版按固定页号替换的实现。',
  literacyPolicy:'本轮没有给正文设置新增字数量配额。文案确认后再按实际正文核算、安排共读，不倒逼正文。',
  books
};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(sourceFile,JSON.stringify(candidate,null,2)+'\n');
fs.writeFileSync(path.join(output,'30篇修订稿-v9-待确认.json'),JSON.stringify(candidate,null,2)+'\n');
const paragraphHtml=paragraphs=>`<ol class="prose">${paragraphs.map((p,i)=>`<li><span class="para-no" aria-label="第${i+1}段">${String(i+1).padStart(2,'0')}</span><p>${escape(display(p))}</p></li>`).join('')}</ol>`;
const chips=books.map(b=>`<a class="toc-item" href="#book-${b.number}"><span>${String(b.number).padStart(2,'0')}</span><strong>${escape(display(b.title))}</strong><small>待确认</small></a>`).join('');
const article=book=>{
  const old=baseline.books.find(b=>b.number===book.number);
  const row=audit.rows.find(r=>r.number===book.number);
  return `<article class="book" id="book-${book.number}" data-number="${book.number}" data-search="${escape(display([book.number,book.title,...book.paragraphs,...book.changes].join(' ')))}">
    <header class="book-head"><span class="eyebrow">第 ${String(book.number).padStart(2,'0')} 篇 · ${escape(book.form)}</span><span class="pending">待你确认</span><h2>${escape(display(book.title))}</h2>${book.title!==old.title?`<p class="retitle">上版标题：${escape(display(old.title))}</p>`:''}</header>
    <div class="reading-layout"><section class="new-copy" aria-label="修订后完整正文">${paragraphHtml(book.paragraphs)}</section>
      <aside class="changes"><h3>这篇改了什么</h3><ul>${book.changes.map(n=>`<li>${escape(n)}</li>`).join('')}</ul>${book.personalization.length?`<p class="setting">定稿时核对：${escape(book.personalization.join('、'))}。当前为示例文字。</p>`:''}<p class="setting">按阅读节奏分段，尚未固定印刷页数。</p></aside></div>
    <details class="baseline"><summary>查看上一版全文与问题依据</summary><p class="baseline-note">以下是v8待审稿，按原来的页次转录；不是当前书架全部采用的文案。本轮修订以它的30篇目录为起点。</p><h3>${escape(display(old.title))}</h3>${paragraphHtml(old.pages.map(p=>p.join('')))}
      <h4>上轮核对意见</h4><ul>${row.notes.revised.map(n=>`<li><b>${escape(n.level)}：</b>${escape(n.problem)}</li>`).join('')}</ul><p class="baseline-note">来源：${escape(row.versions.at(-1).book.ref.file)}；本篇来源旧序${book.sourceNumber}。版本关联不代表历史文案已经获得确认。</p></details>
  </article>`;
};
const changeRows=books.map(b=>`<tr><td>${b.number}</td><td><a href="#book-${b.number}">${escape(display(b.title))}</a>${b.title!==b.previousTitle?`<small>原题：${escape(display(b.previousTitle))}</small>`:''}</td><td>${b.changes.map(escape).join('<br>')}</td></tr>`).join('');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>30篇文案 · 本轮修订第1版 · 待确认</title><style>
:root{--ink:#293831;--muted:#6d786e;--green:#315f4c;--line:#dfe5dc;--paper:#fffefa;--bg:#f2f4ee;--gold:#967040}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.8 'Microsoft YaHei','PingFang SC',sans-serif}a{color:var(--green);text-underline-offset:3px}button,input,select{font:inherit}button,a,select,input{outline-offset:4px}button{cursor:pointer}h1{font-size:32px;line-height:1.4;margin:10px 0 15px}h2{font-size:28px;line-height:1.5;margin:12px 0 8px}h3{font-size:17px}h4{font-size:15px}.hero{max-width:1152px;margin:0 auto;padding:35px 24px 26px}.hero p{margin:8px 0;font-size:15px;max-width:1000px}.eyebrow{color:var(--green);font-size:13px;letter-spacing:.06em}.global-note{color:var(--muted)}.bar{position:sticky;top:0;z-index:5;background:#fffef9f5;border-top:1px solid var(--line);border-bottom:1px solid var(--line);backdrop-filter:blur(7px)}.bar-inner{max-width:1152px;padding:12px 24px;margin:auto;display:flex;align-items:center;gap:9px;flex-wrap:wrap}.bar a{padding:5px 9px;font-size:14px;text-decoration:none}.bar a[aria-current="page"]{background:#e5ecdf;border-radius:6px}.bar input{margin-left:auto;max-width:245px;min-width:170px;flex:1;padding:8px 11px;border:1px solid #aebcaf;border-radius:6px;font-size:14px}.bar button,.pager button{background:var(--paper);border:1px solid #bdcbbb;border-radius:6px;padding:8px 12px;color:var(--green);font-size:14px}.bar button:hover,.pager button:hover{background:#e8efe3}main{max-width:1152px;padding:24px;margin:auto}.panel,.book{background:var(--paper);border:1px solid var(--line);border-radius:12px;margin-bottom:24px}.panel{padding:25px}.panel p{margin:10px 0}.toc{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.toc-item{display:grid;grid-template-columns:32px 1fr;gap:3px 10px;background:#f5f7f0;padding:13px 15px;border:1px solid var(--line);border-radius:8px;text-decoration:none;align-items:start}.toc-item>span{color:#7b8b7c;font-size:13px;margin-top:3px}.toc-item strong{font-size:15px;font-weight:500}.toc-item small{grid-column:2;color:var(--gold);font-size:11px}.pager{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#e8ede3;padding:14px 18px;border:1px solid var(--line);border-radius:10px;margin-bottom:22px}.pager label{font-size:14px}.pager select{padding:9px 10px;border:1px solid #aebcaf;border-radius:6px;min-width:245px;max-width:100%;background:var(--paper);color:var(--ink)}.pager #position{font-size:13px;color:var(--muted);margin-left:auto}.pager button:disabled{opacity:.45;cursor:default}.view-note{font-size:13px;color:var(--muted);margin:5px 0 18px}.book{padding:30px}.book-head{border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:12px}.book-head .pending{float:right;font-size:12px;color:var(--gold);padding:3px 10px;border:1px solid #dfd0b6;border-radius:20px}.retitle{color:var(--muted);font-size:13px;margin:0}.reading-layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:34px}.prose{list-style:none;padding:0;margin:8px 0}.prose li{display:flex;gap:18px;align-items:baseline;padding:10px 0}.prose p{font-size:21px;line-height:1.95;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.para-no{flex-shrink:0;width:23px;color:#9ba696;font-size:11px}.changes{background:#f0f3e9;border:1px solid #e1e6d8;border-radius:8px;padding:18px 20px;align-self:start;margin-top:17px}.changes h3{margin:0 0 10px}.changes ul{padding-left:19px;margin:0}.changes li{font-size:14px;line-height:1.9;margin-bottom:11px}.setting{font-size:12px;color:var(--muted);border-top:1px solid #d8dfcf;padding-top:10px;margin-bottom:0}.baseline{border-top:1px solid var(--line);margin-top:26px;padding-top:10px}.baseline summary{cursor:pointer;font-size:14px;color:var(--green);padding:10px 0}.baseline .prose p{font-size:16px}.baseline .prose li{padding:5px 0}.baseline .prose{max-width:750px}.baseline-note{font-size:13px;color:var(--muted)}.baseline ul{font-size:14px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:13px 12px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}th{background:#eaf0e3}td:nth-child(2){width:220px}td small{display:block;font-size:12px;color:var(--muted);margin-top:6px}.hidden{display:none!important}.search-state{font-size:13px;color:var(--muted)}.not-found{background:#fffefa;padding:25px;border:1px solid var(--line);border-radius:9px}.foot{font-size:13px;color:var(--muted);padding:15px 0 30px;text-align:center}.sr-only{position:absolute;left:-10000px}html{scroll-padding-top:95px}.start-link{display:inline-block;background:var(--green);color:white;padding:9px 18px;border-radius:7px;text-decoration:none;margin:8px 0}.notice{border-left:3px solid #aa8b51;background:#f7f1e4;padding:12px 16px;font-size:14px}.under-nav{display:flex;gap:12px;align-items:center;justify-content:flex-end;margin-bottom:24px}.under-nav button{border:1px solid #bdcbbb;background:var(--paper);border-radius:6px;padding:9px 16px;color:var(--green)}
@media(max-width:820px){.hero{padding:26px 18px 20px}h1{font-size:26px}main{padding:18px 12px}.reading-layout{grid-template-columns:1fr;gap:14px}.changes{margin-top:5px}.toc{grid-template-columns:1fr 1fr}.book{padding:23px 19px}.prose p{font-size:19px}.bar-inner{padding:10px 12px}.bar input{max-width:none}.pager select{min-width:0;flex:1}.pager #position{margin-left:0}.panel{padding:21px 17px}.prose li{gap:10px}.bar{position:static}html{scroll-padding-top:12px}}
@media(max-width:470px){.toc{grid-template-columns:1fr}.bar a{padding:4px 6px}.bar input{flex-basis:70%;}.prose p{font-size:18px}.book-head .pending{float:none;display:inline-block;margin-left:10px}.pager{padding:12px}.pager select{width:100%;flex-basis:100%}}
@media print{body{background:white}.hero{padding:0 0 15px}.bar,.pager,.under-nav,.baseline,.foot,.changes,#contents,#change-list,.not-found,.view-note{display:none!important}main{max-width:none;padding:0}#reader{display:block!important}.book{display:block!important;border:0;border-radius:0;padding:0;break-before:auto;margin-bottom:25px}.book-head{padding-top:15px}.prose p{font-size:15pt}.prose li{break-inside:avoid}.reading-layout{display:block}h2{break-after:avoid}.hero h1{font-size:22pt}}
</style></head><body><header class="hero"><div class="eyebrow">文案修订 · 2026年10月24日</div><h1>30篇文案 · 本轮修订第1版</h1><p><b>30篇全部待你确认。确认前不出图，不替换当前书架和已有校样。</b></p><p>这一版先把句子、动作和故事讲顺，没有按识字配额或原来的页数填句子。下方的编号是段落，方便你指出要改的位置。</p><p class="global-note">审稿示例：小石头、五岁、大班；家庭篇为爸爸、妈妈和孩子三口人。实际姓名、年龄、班级和出场家人还需按设置核对。</p></header>
<nav class="bar" aria-label="审稿导航"><div class="bar-inner"><a href="#contents" data-view="contents">30篇目录</a><a href="#book-1" data-view="single">逐篇阅读</a><a href="#all" data-view="all">连续阅读全文</a><a href="#change-list" data-view="changes">修改一览</a><label class="sr-only" for="search">搜索标题、正文或修改说明</label><input id="search" type="search" placeholder="搜索标题、正文或修改说明"><button id="clear-search">清空</button><span id="search-status" class="search-state" role="status"></span></div></nav>
<main><section id="contents" class="panel"><h2>30篇审阅目录</h2><p>按篇号依次阅读，或切换到“连续阅读全文”。每篇附完整正文、修改说明和上一版全文。</p><p class="notice">这里的“修订完成”仅表示新稿已经写好，所有文案仍待确认。没有把旧稿的“审阅”或“插画完成”当作你认可文案的依据。</p><a class="start-link" href="#book-1">从第1篇开始阅读 →</a><div class="toc">${chips}</div></section>
<div id="reader-pager" class="pager"><label for="book-picker">选择篇目</label><select id="book-picker" aria-label="选择篇目">${books.map(b=>`<option value="${b.number}">${String(b.number).padStart(2,'0')} · ${escape(display(b.title))}</option>`).join('')}</select><button id="previous" aria-label="上一篇">← 上一篇</button><button id="next" aria-label="下一篇">下一篇 →</button><span id="position" aria-live="polite">1 / 30 · 待确认</span></div>
<p id="reading-note" class="view-note">反馈时可直接写“第几篇、第几段”。分段仅供审稿，文案确认后再安排A5分镜和分页。</p>
<p id="no-results" class="not-found hidden">没有找到匹配的正文或标题。换一个词试试。</p>
<section id="reader" aria-label="30篇完整修订正文">${books.map(article).join('')}</section>
<div id="bottom-pager" class="under-nav"><button id="bottom-previous">← 上一篇</button><button id="bottom-next">下一篇 →</button></div>
<section id="change-list" class="panel"><h2>30篇修改一览</h2><p>篇号沿用上轮报告中的30篇候选目录；改变标题和主题的地方均在这里说明。旧稿、当前书架和已有图片均未覆盖。</p><div class="table-wrap"><table><thead><tr><th>篇</th><th>本轮标题</th><th>修改内容</th></tr></thead><tbody>${changeRows}</tbody></table></div></section>
<footer class="foot">本轮修订第1版（v9） · 30篇待确认 · 文字审稿阶段</footer></main>
<script>
const cards=[...document.querySelectorAll('.book')],picker=document.getElementById('book-picker'),search=document.getElementById('search'),status=document.getElementById('search-status');
let current=1;
function show(el,visible){document.getElementById(el).classList.toggle('hidden',!visible);}
function paging(){picker.value=String(current);document.getElementById('position').textContent=current+' / 30 · 待确认';['previous','bottom-previous'].forEach(id=>document.getElementById(id).disabled=current===1);['next','bottom-next'].forEach(id=>document.getElementById(id).disabled=current===30);}
function render(){const hash=location.hash.slice(1)||'book-1';const match=hash.match(/^book-(\\d+)$/);const view=hash==='contents'?'contents':hash==='change-list'?'changes':hash==='all'?'all':'single';if(match)current=Math.max(1,Math.min(30,Number(match[1])));
 const query=search.value.trim().toLowerCase();show('contents',!query&&view==='contents');show('change-list',!query&&view==='changes');show('reader',!!query||view==='single'||view==='all');show('reader-pager',!query&&view==='single');show('bottom-pager',!query&&view==='single');show('reading-note',!!query||view==='single'||view==='all');let found=0;
 cards.forEach(card=>{const hit=query?card.dataset.search.toLowerCase().includes(query):view==='all'||view==='single'&&Number(card.dataset.number)===current;card.classList.toggle('hidden',!hit);if(hit)found++;});
 show('no-results',!!query&&!found);status.textContent=query?'匹配 '+found+' 篇':'';document.querySelectorAll('.bar a[data-view]').forEach(a=>{if(!query&&a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});paging();}
function move(delta){search.value='';location.hash='book-'+Math.max(1,Math.min(30,current+delta));}
picker.addEventListener('change',()=>{search.value='';location.hash='book-'+picker.value;});
['previous','bottom-previous'].forEach(id=>document.getElementById(id).addEventListener('click',()=>move(-1)));['next','bottom-next'].forEach(id=>document.getElementById(id).addEventListener('click',()=>move(1)));
search.addEventListener('input',render);document.getElementById('clear-search').addEventListener('click',()=>{search.value='';render();});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{search.value='';}));
function onRoute(){render();if(search.value.trim())return;const h=location.hash;const target=h==='#contents'?'contents':h==='#change-list'?'change-list':h==='#all'?'reader':'reader-pager';requestAnimationFrame(()=>document.getElementById(target).scrollIntoView({block:'start'}));}
window.addEventListener('hashchange',onRoute);onRoute();
</script></body></html>`;
fs.writeFileSync(path.join(output,'30篇文案-修订第1版-待确认.html'),html);
const front=['第一级30篇文案 · 本轮修订第1版（v9，全部待确认）','2026-10-24','没有出图，没有替换当前书架或已有PDF。','审稿示例：小石头、五岁、大班；家庭篇为三口家庭。实际设置还需核对。','以下按阅读节奏分段，不是A5定稿页码。',''];
const continuous=[...front,...books.flatMap(b=>[`第${String(b.number).padStart(2,'0')}篇  ${display(b.title)}`,'',...b.paragraphs.map((p,i)=>`${i+1}. ${display(p)}`),'','修改说明：',...b.changes.map(s=>'－ '+s),'状态：待用户确认。','\n'])].join('\n');
fs.writeFileSync(path.join(output,'30篇文案-修订第1版-全文.txt'),continuous);
const previousHashes=JSON.parse(fs.readFileSync(path.join(workspace,'tmp/manuscript-v9-before-hashes.json'),'utf8'));
const modifiedPrevious=previousHashes.files.filter(f=>sha(path.join(workspace,f.path))!==f.sha256);
assert.deepEqual(modifiedPrevious,[],'previous manuscript and runtime files must not be changed');
const checks={createdAt:new Date().toISOString(),stories:books.length,allAwaitingConfirmation:books.every(b=>b.reviewStatus==='awaiting-user-confirmation'&&b.userDecision===null),confirmedBooks:[],paragraphs:books.map(b=>({number:b.number,title:b.title,count:b.paragraphs.length})),oldSourceFilesUnchanged:previousHashes.files.length,oldSourceChanges:modifiedPrevious,baselineSha256:sha(baselineFile),candidateSha256:sha(sourceFile),newImagesGenerated:0,shelfChanged:false,pdfChanged:false,sourceFile,output};
fs.writeFileSync(path.join(output,'revision-verification.json'),JSON.stringify(checks,null,2)+'\n');
console.log(JSON.stringify({stories:books.length,paragraphs:books.reduce((s,b)=>s+b.paragraphs.length,0),renamed:books.filter(b=>b.title!==b.previousTitle).map(b=>({n:b.number,old:b.previousTitle,new:b.title})),previousFilesUnchanged:previousHashes.files.length,sourceFile,output},null,2));
