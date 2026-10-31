'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const workspace = path.resolve(__dirname, '..');
const root = path.join(workspace, 'little-protagonist');
const output = path.join(workspace, 'output/manuscript-audit');
const notes = require('./manuscript-audit-notes.cjs');
const {listBooks} = require(path.join(root, 'miniprogram/lib/stories'));
const {defaultMembers} = require(path.join(root, 'miniprogram/lib/family'));
const {personalizeReviewedBooks, auditReviewedBooks} = require(path.join(root, 'miniprogram/lib/reviewed-personalization'));
const profile = {name: '小石头', age: 5, className: '大班'};
const members = defaultMembers();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fingerprint = book => JSON.stringify([book.title.replaceAll('小石头','CHILD'), book.pages.map(p=>p.map(s=>s.replaceAll('小石头','CHILD')))]);
const norm = text => text.replace(/\s+/gu, '');
const fileRefs = new Map();
function sourceRef(file, book) {
  const absolute = path.join(root,file);
  if (!fileRefs.has(file)) {
    const text = fs.readFileSync(absolute,'utf8');
    fileRefs.set(file, {file, absolute, sha256: sha(absolute), text});
  }
  const info = fileRefs.get(file);
  const needle = '"title": ' + JSON.stringify(book.title);
  let at = info.text.indexOf(needle);
  if (at < 0 && file.endsWith('stories.js')) at = info.text.indexOf("id: '" + book.id + "'");
  if (at < 0 && file.endsWith('family.js')) at = info.text.indexOf('function familyBook(');
  const line = at < 0 ? 1 : info.text.slice(0,at).split('\n').length;
  return {file, absolute, line};
}
const sourceFiles = ['content/level1-stories-04-10.json', 'content/level1-stories-11-20.json','content/level1-stories-21-40.json'];
const prototype = listBooks(profile,undefined).map((b,i)=>({...b,number:i+1,sourceNumber:i+1,ref:sourceRef('miniprogram/lib/stories.js',b)}));
const originals = [...prototype, ...sourceFiles.flatMap(file=>read(file).books.map(b=>({...b,sourceNumber:b.number,ref:sourceRef(file,b)})))];
const current = listBooks(profile,members,{includeApproved:true}).map((b,i)=>({...b,number:i+1,sourceNumber:i+1,
  ref:sourceRef(i<3?'miniprogram/lib/'+(i===2?'family.js':'stories.js'):'miniprogram/lib/level1-approved.js',b)}));
const versionDefs = [
  ['balanced','30篇平衡稿','content/level1-stories-balanced-30.json','30篇选题与顺序；仍为待审稿。'],
  ['v3','v3 故事性复审稿','output/text/manuscript-before-series-v4.json','此文件是改v4之前的快照，实际内容版本为v3，不是v4。'],
  ['v4','v4 全册与复现稿','output/text/manuscript-before-recurrence-v5.json','改v5之前保存的v4快照。'],
  ['v5','v5 自然复现稿','output/text/manuscript-before-naturalness-v6.json','改v6之前保存的v5快照。'],
  ['v6','v6 故事优先稿','output/text/manuscript-before-remaining-v7.json','改v7之前保存的v6快照。'],
  ['v7','v7 余篇修订稿','output/text/manuscript-before-personalization-v8.json','改v8之前保存的v7快照。'],
  ['v8','v8 个性化与语句修订稿','content/level1-stories-reviewed-30.json','当前30篇候选文稿；仍为待审稿，未接入当前书架。']
];
const versions = versionDefs.map(([id,label,file,description])=>{
  const d=read(file);
  assert.equal(d.books.length,30);
  return {id,label,file,description,status:d.status,edition:d.edition,
    books:d.books.map(b=>({...b,ref:sourceRef(file,b)}))};
});
const latest = versions.at(-1);
assert.equal(fs.readFileSync(path.join(root,latest.file),'utf8'), fs.readFileSync(path.join(root,'content/level1-reviewed-manuscript-source.json'),'utf8'));
sourceRef('content/level1-reviewed-manuscript-source.json',latest.books[0]);
const compressedSource = read('content/level1-stories-condensed-20.json');
const compressed = compressedSource.books.map(b=>({...b,ref:sourceRef('content/level1-stories-condensed-20.json',b)}));
const statsBooks = personalizeReviewedBooks(latest.books,profile,members,{forStatistics:true});
const stats = auditReviewedBooks(statsBooks);
const pdfEvidence = JSON.parse(fs.readFileSync(path.join(output,'pdf-text-evidence.json'),'utf8'));
const pdfIndex = [read('../output/pdf/前十本合集-实际PDF检查.json'), read('../output/pdf/第2册十故事合集-实际PDF检查.json')];
const pdfChecks=[];
for (const book of current) {
  const vi = book.number<=10?0:1;
  const chapter=pdfIndex[vi].summary.chapters.find(c=>c.book===book.id);
  assert.ok(chapter,book.id+': chapter must exist');
  const pages=book.pages.map((lines,i)=>{
    const pdfPage=chapter.start_pdf_page+i;
    const text=pdfEvidence[vi].pages[pdfPage-1]?.text||'';
    const missing=lines.filter(line=>!norm(text).includes(norm(line)));
    return {storyPage:i+1,pdfPage,lines,text,missing,match:missing.length===0};
  });
  const check={number:book.number,id:book.id,title:book.title,volume:vi+1,
    pdfFile:pdfEvidence[vi].file,startPdfPage:chapter.start_pdf_page,
    endPdfPage:chapter.start_pdf_page+book.pages.length-1,pages,match:pages.every(p=>p.match)};
  pdfChecks.push(check);
  book.pdf={...check,pages:undefined};
}
const rowData=latest.books.map((book,i)=>{
  const original=originals.find(b=>b.sourceNumber===book.sourceNumber);
  const actual=current.find(b=>b.sourceNumber===book.sourceNumber);
  assert.ok(original); assert.ok(notes[book.number]);
  const rows=versions.map(v=>({version:v.id,label:v.label,book:v.books.find(b=>b.sourceNumber===book.sourceNumber)}));
  assert.ok(rows.every(r=>r.book));
  return {number:book.number,sourceNumber:book.sourceNumber,title:book.title,original,current:actual||null,
    versions:rows,compressed:compressed.filter(b=>b.sourceNumbers.includes(book.sourceNumber)),notes:notes[book.number],
    statistics:{newCharacters:stats[i].newCount,peakNewOnPage:stats[i].peak,totalCharacters:stats[i].count,cumulative:stats[i].cumulativeCount}};
});
const sourceSet=new Set(latest.books.map(b=>b.sourceNumber));
const extraOriginals=originals.filter(b=>!sourceSet.has(b.number)).map(b=>({...b,current:current.find(c=>c.number===b.number)||null,...notes.extras[b.number]}));
const currentOnly=extraOriginals.filter(b=>b.current);
assert.equal(currentOnly.length,4);
const currentMapped=rowData.filter(r=>r.current);
assert.equal(currentMapped.length,16);
assert.equal(rowData.length,30);
assert.equal(pdfChecks.reduce((a,b)=>a+b.pages.length,0),147);
const versionsSummary=versions.map((v,i)=>({...v,books:undefined,
  changedSincePrevious:i? v.books.filter(b=>fingerprint(b)!==fingerprint(versions[i-1].books.find(old=>old.sourceNumber===b.sourceNumber))).map(b=>b.number):[]}));
const archive={generatedAt:new Date().toISOString(),scope:'只读文案核对；没有改稿、出图或重建PDF。',profile,members,
  evidenceLimit:'没有找到逐篇人工定稿确认；文件名approved、reviewed和内部编写说明不等于用户确认。以文件可核验的内容为限，不推断历史作者。',
  numbering:'主目录仅用v8的30篇编号组织对照，不表示决定采用v8；sourceNumber用于来源关联，不表示各版内容仍然相同。',
  current,rows:rowData,extraOriginals,versions:versionsSummary,compressed:{title:compressedSource.title,status:compressedSource.status,books:compressed},
  pdfChecks,sources:[...fileRefs.values()].map(({text,...r})=>r)};
fs.writeFileSync(path.join(output,'30篇版本与采用文案-证据.json'),JSON.stringify(archive,null,2)+'\n');

function refLink(ref) { return `<a class="source" href="${esc('file:///'+ref.absolute.replaceAll('\\','/'))}">${esc(ref.file)} · 第${ref.line}行附近</a>`; }
function body(book,heading) {
  if(!book)return `<section class="text-block empty"><h4>${esc(heading)}</h4><p>当前书架和已导出两册未采用此候选故事。</p></section>`;
  return `<section class="text-block"><h4>${esc(heading)}</h4><p class="book-title">${esc(book.title)} <small>${book.pages.length}页</small></p>
  <ol class="pages">${book.pages.map((lines,i)=>`<li><b>P${i+1}</b><div>${lines.map(s=>`<p>${esc(s)}</p>`).join('')}</div></li>`).join('')}</ol>${refLink(book.ref)}</section>`;
}
function findings(list) {
  return list.length?list.map(n=>`<section class="finding ${n.level==='建议修改'?'change':n.level==='可保留'?'keep':'consider'}"><b>${esc(n.level)}</b><p class="quote">${esc(n.evidence)}</p><p>${esc(n.problem)}</p><p class="direction">建议方向：${esc(n.direction)}</p></section>`).join(''):'<p class="muted">此候选故事当前未采用，暂无对应的现用正文可评。</p>';
}
function versionsHtml(row) {
  const unique=[];
  for(const v of row.versions){
    const existing=unique.find(u=>fingerprint(u.book)===fingerprint(v.book));
    if(existing)existing.labels.push(v.label);else unique.push({book:v.book,labels:[v.label]});
  }
  return `<p class="muted">完全相同的标题和正文合并展示，保留版本名称。页数变化时不可按同页号直接换图。</p>${body(row.original,'最初来源稿／原型（非确认稿）')}
  ${unique.map(u=>body(u.book,u.labels.join(' / '))).join('')}
  <h4>20篇压缩稿中的关联</h4><p class="muted">以下按文件sourceNumbers列出合并关联；它可能混入多个原故事，不是本篇的等价版本。</p>${row.compressed.length?row.compressed.map(b=>body(b,`压缩稿第${b.number}篇 · 标注合并旧序${b.sourceNumbers.join('、')}`)).join(''):'<p>压缩稿未标注关联。</p>'}`;
}
function storyCard(row) {
  const {number,notes:n}=row;
  const primary=row.current?n.current:n.revised;
  const currentLabel=row.current?`当前第${row.current.number}篇 · 第${row.current.pdf.volume}册PDF ${row.current.pdf.startPdfPage}–${row.current.pdf.endPdfPage}页`:'当前未采用';
  return `<article id="story-${number}" class="story-card searchable" data-search="${esc(JSON.stringify([row.title,row.original.title,row.current?.title,n,row.versions.map(v=>v.book.pages)]))}">
  <header><span class="eyebrow">30篇目录 ${String(number).padStart(2,'0')} · 来源旧序 ${row.sourceNumber}</span><h2>${esc(row.title)}</h2><p class="status">${esc(currentLabel)} · 人工定稿确认：未找到</p></header>
  <p class="assessment">${esc(n.assessment)}</p><p class="delta"><b>版本变化：</b>${esc(n.delta)}</p>
  <div class="compare">${body(row.current,'现在实际采用的完整文案')}${body(row.versions.at(-1).book,'v8修订稿完整文案（仍待审）')}</div>
  <div class="compare issues"><section><h3>现用文案的内容意见</h3>${findings(n.current)}</section><section><h3>v8修订稿的内容意见</h3>${findings(n.revised)}</section></div>
  <p class="stats">v8默认三口家庭：本篇用字${row.statistics.totalCharacters}，相对前文新增${row.statistics.newCharacters}，单页最多首次${row.statistics.peakNewOnPage}，累计接触${row.statistics.cumulative}。只统计接触，不代表孩子掌握；不含姓名。</p>
  <details class="history"><summary>展开各历史版本完整文案、来源及压缩稿关联</summary>${versionsHtml(row)}</details><a class="back" href="#overview">返回总览 ↑</a></article>`;
}
const currentCard=book=>{
  const row=rowData.find(r=>r.sourceNumber===book.number),extra=extraOriginals.find(r=>r.number===book.number);
  const review=row?row.notes.current:extra.issues;
  return `<article id="current-${book.number}" class="current-card searchable" data-search="${esc(JSON.stringify([book.title,book.pages,review]))}"><h3>现用 ${String(book.number).padStart(2,'0')} · ${esc(book.title)}</h3>
  <p>${row?`对应30篇目录第${row.number}篇 <a href="#story-${row.number}">${esc(row.title)}</a>`:'不在30篇目录中；不能假定将保留'} · 第${book.pdf.volume}册PDF ${book.pdf.startPdfPage}–${book.pdf.endPdfPage}页</p>
  ${body(book,'现用正文逐页转录')}${findings(review)}<p class="muted">PDF逐页文字核对：${book.pdf.match?'全部原句均找到':'存在差异，见证据JSON'}；此核对不代表内容获批。</p></article>`;
};
const overviewRows=rowData.map(row=>`<tr><td>${row.number}</td><td><a href="#story-${row.number}">${esc(row.title)}</a><small>旧序${row.sourceNumber} ${esc(row.original.title)}</small></td><td>${row.current?`现用${row.current.number} · ${esc(row.current.title)}`:'未采用'}</td><td>${esc(row.current?row.notes.current.map(n=>n.problem).join('；'):row.notes.revised.map(n=>n.problem).join('；'))}</td></tr>`).join('');
const currentTextsSame=currentMapped.filter(row=>fingerprint(row.current)===fingerprint(row.versions.at(-1).book));
const pdfMatch=pdfChecks.every(p=>p.match);
const totalBody=latest.books.reduce((s,b)=>s+b.pages.length,0);
const sourceRegistry=archive.sources.map(s=>`<tr><td>${esc(s.file)}</td><td><code>${s.sha256.slice(0,16)}</code></td></tr>`).join('');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>30篇绘本文案 · 版本、实际采用与逐篇问题核对</title>
<style>
:root{--ink:#24332e;--muted:#67756d;--green:#255b49;--line:#dce3de;--paper:#fff;--bg:#f3f5f1;--orange:#ac5422}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:105px}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.8 'Microsoft YaHei','PingFang SC',sans-serif}a{color:var(--green);text-underline-offset:3px}main{max-width:1240px;padding:32px 28px 70px;margin:auto}header.hero{background:#e3ece3;border-bottom:1px solid var(--line);padding:42px max(28px,calc((100% - 1184px)/2));}h1{font-size:32px;line-height:1.4;margin:8px 0 16px}h2{font-size:25px;line-height:1.5;margin:5px 0 12px}h3{font-size:18px;margin:12px 0}h4{font-size:16px;margin:0 0 10px}.eyebrow{font-size:13px;color:var(--green);letter-spacing:.08em}.hero p{max-width:1000px;margin:8px 0}.hero strong{color:#8d3c20}.toolbar{position:sticky;top:0;z-index:5;display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fffef9f5;border-bottom:1px solid var(--line);padding:12px max(20px,calc((100% - 1184px)/2));backdrop-filter:blur(8px)}.toolbar a{padding:5px 8px;text-decoration:none;font-size:14px}.toolbar input{min-width:180px;max-width:270px;flex:1;border:1px solid #a7b4a9;border-radius:7px;padding:9px 12px;font:inherit;font-size:14px}.toolbar button{border:1px solid var(--line);background:white;border-radius:6px;padding:8px 10px;cursor:pointer;color:var(--green)}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}.metric{background:white;border:1px solid var(--line);padding:18px;border-radius:10px}.metric b{font-size:32px;display:block;color:var(--green)}.metric span{color:var(--muted);font-size:14px}.panel,.story-card,.current-card{background:white;border:1px solid var(--line);padding:26px;border-radius:12px;margin:0 0 25px}.panel p{margin:9px 0}.attention{border-left:4px solid var(--orange);background:#fff4e8;padding:16px 20px;margin:18px 0}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{border-bottom:1px solid var(--line);padding:13px 12px;vertical-align:top;text-align:left}th{background:#edf2eb}td small{display:block;color:var(--muted);margin-top:5px}#overview table th:nth-child(1){width:45px}#overview table th:nth-child(2){width:240px}#overview table th:nth-child(3){width:205px}.status,.muted,.source,.stats{font-size:13px;color:var(--muted)}.source{display:block;overflow-wrap:anywhere;line-height:1.6;margin-top:12px}.assessment{font-size:18px;font-weight:bold}.delta{border-left:3px solid #a6bda7;padding-left:15px}.compare{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}.text-block{border:1px solid var(--line);padding:18px 20px;margin:12px 0;background:#fcfdfb;min-width:0}.empty{background:#f4f5f2;color:var(--muted)}.book-title{font-size:18px;font-weight:bold;margin:2px 0 12px}.book-title small{font-size:13px;font-weight:normal;color:var(--muted);margin-left:8px}.pages{padding:0;list-style:none;margin:0}.pages li{display:flex;gap:14px;padding:9px 0;border-top:1px dashed var(--line)}.pages li b{width:28px;flex-shrink:0;color:#859489;font-size:12px;line-height:2.5}.pages p{margin:0}.finding{padding:13px 15px;margin:12px 0;background:#f4f6f0;border-left:3px solid #a3b099}.finding.change{background:#fff4e9;border-color:#ba6936}.finding.consider{background:#f6f4ed;border-color:#b5a36e}.finding p{font-size:14px;margin:7px 0}.finding .quote{font-weight:600}.finding .direction{color:var(--muted)}.finding b{font-size:13px}.stats{padding:12px 0;border-top:1px solid var(--line)}summary{cursor:pointer;color:var(--green);font-weight:bold;padding:12px 0}.history{margin-top:15px;border-top:1px solid var(--line)}.history .text-block{max-width:760px}.back{display:inline-block;font-size:13px;margin-top:15px}.current-card .text-block{max-width:760px}.section-title{margin:40px 0 20px}.hidden{display:none!important}#filter-state{font-size:12px;color:var(--muted)}code{font-family:Consolas,monospace;font-size:12px;overflow-wrap:anywhere}ol.steps{padding-left:24px}.registry td:first-child{overflow-wrap:anywhere}.sr-only{position:absolute;left:-10000px}footer{text-align:center;color:var(--muted);font-size:13px;margin-top:35px}
@media(max-width:750px){main{padding:20px 14px 45px}header.hero{padding:28px 20px}h1{font-size:26px}.metrics{grid-template-columns:1fr 1fr;gap:10px}.compare{grid-template-columns:1fr}.panel,.story-card,.current-card{padding:19px 16px}.toolbar{position:static;padding:12px 14px}.toolbar input{max-width:none}.text-block{padding:16px 14px}.metric{padding:14px}html{scroll-padding-top:12px}}
@media print{body{background:white;font-size:11pt}.toolbar,.back{display:none}header.hero{padding:15px 25px}main{max-width:none;padding:20px}.panel,.story-card,.current-card{border-radius:0;break-inside:auto}.story-card,.current-card{break-before:page}.compare{display:block}.text-block,.finding{break-inside:avoid}.metrics{grid-template-columns:repeat(4,1fr)}a{color:inherit;text-decoration:none}.history{display:none}th{background:#eee}h2,h3,h4{break-after:avoid}}
.picker select{font:inherit;padding:9px 12px;max-width:100%;border:1px solid #a7b4a9;border-radius:7px;background:white;color:var(--ink)}.picker{display:flex;gap:12px;align-items:center;flex-wrap:wrap}</style></head><body>
<header class="hero"><div class="eyebrow">文案来源核对 · 2026年10月24日 · 未改稿／未出图</div><h1>30篇绘本：版本、实际采用与逐篇内容问题</h1><p><strong>没有找到这30篇逐篇经过用户定稿的依据。</strong>“approved”“reviewed”“已完成插画”是项目内部名称或状态，不能替代用户确认。本报告不决定采用哪一版。</p><p>主目录按v8的30篇编号组织，仅便于比对；同时保留旧序号和当前书架序号。内容意见是本次编辑判断，分为“建议修改”“可斟酌”“可保留”，并非每篇都有硬错误。</p></header>
<nav class="toolbar" aria-label="报告导航"><a href="#overview">30篇总览</a><a href="#current">当前20篇全文</a><a href="#details">逐篇版本与问题</a><a href="#extras">旧稿补充</a><a href="#registry">版本档案</a><label class="sr-only" for="search">搜索标题、文案或问题</label><input id="search" placeholder="搜索：果子、来去、小猫…" type="search"><button id="clear">清空</button><button id="expand">展开历史正文</button><span id="filter-state" role="status">显示全部</span></nav>
<main><section id="metrics" class="metrics" aria-label="核对结果"><div class="metric"><b>20</b><span>当前书架／两册采用故事</span></div><div class="metric"><b>30</b><span>v8候选故事，正文${totalBody}页</span></div><div class="metric"><b>4</b><span>现用故事不在30篇目录</span></div><div class="metric"><b>14</b><span>30篇候选故事当前未上架</span></div></section>
<section id="facts" class="panel"><h2>先看这几件事实</h2><ol class="steps"><li>当前书架沿用旧序1–20；${currentMapped.length}篇在30篇稿中有来源关联，但其中仅${currentTextsSame.length}篇的标题和逐页正文在默认配置下与v8一致。其余有不同程度改动或整篇替换。来源关联不等于故事相同。</li><li>《小球在哪》《水中的我》《小球也要走》《小猫的床》四篇在现用20篇里，却不在30篇候选目录。剩余14篇候选也不是简单的“旧序21–30”。</li><li>已保存的30篇候选版本包括平衡稿及v3–v8共7套；另有旧序1–40来源文本、20篇压缩稿。v8的“输出稿”和“编写源稿”文件完全一致，不算两套文案。</li><li>所有30篇候选版本和压缩稿均标注<code>text-draft-awaiting-user-review</code>。旧11–20当前状态是<code>illustrated-through-book-20</code>，只表示插画进度。</li><li>两册现有PDF重新提取文字，${pdfMatch?'147页正文的原句全部与当前运行数据相符':'有正文差异，须查看证据JSON'}。这证明旧文案确实进入了校样，不证明它经过定稿。核对范围是正文，没有把印刷排版检查当作内容审阅。</li></ol>
<div class="attention"><b>“大果子来，大果子去”的实际流向：</b><br>旧序18 → 当前书架18／第2册PDF第65页（故事P4） → 平衡稿第25篇保留同句 → v3起改成《这回我的大》，后改为两片瓜比较大小 → 当前书架和PDF仍没有采用这个修订故事。压缩20篇稿也保留了该来去句。没有查到用户对该句的明确确认。</div>
<p class="muted">统一展示配置：小石头、五岁、大班、孩子＋爸爸＋妈妈。CHILD是原稿姓名占位符，不是漏改的正式姓名。家庭篇有动态生成版本；不把配置导致的页数变化误判为换稿。</p></section>
<section id="overview" class="panel"><h2>30篇目录与当前采用对照</h2><p>点击标题查看两版全文、逐篇问题和完整历史。表中“问题”优先列当前采用稿；当前未采用的，列v8候选稿的审阅意见。</p><div class="table-wrap"><table><thead><tr><th>篇</th><th>v8候选／来源</th><th>当前采用</th><th>内容意见摘要</th></tr></thead><tbody>${overviewRows}</tbody></table></div></section>
<section id="current"><h2 class="section-title">当前书架及两册PDF：20篇实际文案</h2><p>以下由实际运行的<code>listBooks</code>读取，逐页保留原句，不采用编写说明替正文补剧情。每篇均与对应PDF正文页重新核对。</p><p class="picker"><label for="current-picker">选择现用故事：</label><select id="current-picker">${current.map(b=>`<option value="${b.number}">${b.number} · ${esc(b.title)}</option>`).join('')}</select></p>${current.map(currentCard).join('')}</section>
<section id="details"><h2 class="section-title">30篇逐篇版本与问题</h2><p>左侧是实际采用稿，右侧是v8候选稿。没有硬伤的篇目明确写“可保留”；修改方向只是建议，没有替用户改正文。</p><p class="picker"><label for="story-picker">选择对照篇目：</label><select id="story-picker">${rowData.map(b=>`<option value="${b.number}">${b.number} · ${esc(b.title)}</option>`).join('')}</select></p>${rowData.map(storyCard).join('')}</section>
<section id="extras"><h2 class="section-title">补充：没有进入30篇目录的旧稿</h2><p>这10篇来自旧40篇池，其中4篇当前仍在使用。这里保留原文，避免因为新目录没有它们，就把实际采用情况漏掉。</p>${extraOriginals.map(b=>`<article class="panel searchable" id="extra-${b.number}" data-search="${esc(JSON.stringify(b))}"><h3>旧序${b.number} · ${esc(b.title)}</h3><p>${esc(b.assessment)}</p>${b.current?`<p><a href="#current-${b.number}">查看当前采用全文和PDF页码</a></p>`:''}${body(b,'旧稿全文')}${findings(b.issues)}</article>`).join('')}</section>
<section id="registry" class="panel"><h2>版本档案与核对边界</h2><div class="table-wrap"><table><thead><tr><th>版本</th><th>来源与状态</th><th>与前版标题／逐页正文不同的篇号</th></tr></thead><tbody>
<tr><td>旧序1–40来源池</td><td>1–3来自原型代码；4–10、11–20、21–40来自独立审阅JSON。当前采用旧序1–20，其中家庭篇按设置生成。</td><td>原型家庭篇与当前动态家庭篇不同，报告已分别保存。</td></tr>
<tr><td>20篇压缩稿</td><td>${esc(compressedSource.status)}；通过sourceNumbers多对一合并，有些情节和角色发生改变。</td><td>不是当前书架的20篇，不能因篇数相同就认为已采用。</td></tr>
${versionsSummary.map(v=>`<tr><td>${esc(v.label)}<small>${esc(v.edition)}</small></td><td>${esc(v.file)}<br>${esc(v.status)}<br>${esc(v.description)}</td><td>${v.id==='balanced'?'作为30篇候选起点':v.changedSincePrevious.join('、')||'标题和逐页正文无变化'}</td></tr>`).join('')}</tbody></table></div>
<details><summary>20篇压缩稿完整目录与正文</summary>${compressed.map(b=>body(b,`压缩稿第${b.number}篇 · 来源标注旧序${b.sourceNumbers.join('、')}`)).join('')}</details>
<details><summary>来源文件指纹（SHA-256前16位）</summary><table class="registry"><thead><tr><th>文件</th><th>指纹</th></tr></thead><tbody>${sourceRegistry}</tbody></table><p class="muted">完整指纹、原文、逐页PDF核对证据保存在配套JSON。指纹用于复核本报告读取的文件版本，不代表文件经过人工批准。</p></details>
<h3>本次没有做的变更</h3><p>没有生成或编辑图片；没有重写任何绘本正文；没有切换书架目录；没有重新导出或覆盖两册PDF；没有提交、推送或发布站点。</p>
<h3>内容审阅与识字统计的边界</h3><p>本报告独立读过当前20篇、旧来源池、平衡30篇及v8正文，并逐项比较保存的v3–v7修订。中间稿的全部正文可展开查看；本次逐篇编辑意见主要针对现用稿和v8，不冒称每个历史版本都已得到文学质量验收。</p><p>按项目现有统计函数、默认三口家庭，v8前三篇新增字形为20、21、19；全册累计接触233个字形。新增少、每页两行、字表覆盖或自动测试通过，都不能证明句子自然、故事有趣或适合独立初读。数字不是阅读能力评估，也不是用户已确认的教学标准。</p>
<h3>确认依据</h3><p>现有文件能说明文字存在哪里、哪些内容被程序和PDF采用；没有可核验的逐篇人工定稿记录。文件里的编写说明、editorialReview、“approved”变量名及“继续制作”的指令，都不能被本报告当作逐字文案批准。未找到确认记录，不等于能断言历史上从未讨论过任何一篇。</p>
<p>本报告只做核对和问题整理。下一步先确定最终目录与正文，再决定哪些既有插画可以保留，避免在文案尚未定稿时继续消耗出图资源。</p></section>
<footer>本地文案核对报告 · 内容意见待审 · 不代表定稿或发布</footer></main>
<script>
const search=document.getElementById('search');const cards=[...document.querySelectorAll('.searchable')];const filterState=document.getElementById('filter-state');
const panels=['overview','current','details','extras','registry'];
function route(){const h=location.hash.slice(1)||'overview';let panel='overview',selected=null;
 if(h.startsWith('story-')){panel='details';selected=h;}else if(h.startsWith('current-')){panel='current';selected=h;}else if(h.startsWith('extra-')){panel='extras';selected=h;}else if(panels.includes(h))panel=h;
 panels.forEach(id=>document.getElementById(id).classList.toggle('hidden',id!==panel));
 ['metrics','facts'].forEach(id=>document.getElementById(id).classList.toggle('hidden',panel!=='overview'));
 cards.forEach(c=>c.classList.remove('hidden'));
 document.querySelectorAll('.picker').forEach(p=>p.classList.remove('hidden'));
 if(panel==='details'){selected=selected||'story-'+document.getElementById('story-picker').value;document.querySelectorAll('.story-card').forEach(c=>c.classList.toggle('hidden',c.id!==selected));document.getElementById('story-picker').value=selected.split('-')[1];}
 if(panel==='current'){selected=selected||'current-'+document.getElementById('current-picker').value;document.querySelectorAll('.current-card').forEach(c=>c.classList.toggle('hidden',c.id!==selected));document.getElementById('current-picker').value=selected.split('-')[1];}
 filterState.textContent='显示全部';
}
function filter(){const q=search.value.trim().toLowerCase();if(!q){route();return;}let found=0;
 panels.forEach(id=>document.getElementById(id).classList.toggle('hidden',!['current','details','extras'].includes(id)));
 ['metrics','facts'].forEach(id=>document.getElementById(id).classList.add('hidden'));document.querySelectorAll('.picker').forEach(p=>p.classList.add('hidden'));
 cards.forEach(c=>{const hit=c.dataset.search.toLowerCase().includes(q);c.classList.toggle('hidden',!hit);if(hit)found++;});filterState.textContent='匹配 '+found+' 个条目';}
search.addEventListener('input',filter);document.getElementById('clear').addEventListener('click',()=>{search.value='';route();});
document.getElementById('expand').addEventListener('click',event=>{const histories=[...document.querySelectorAll('.history')];const open=histories.some(d=>!d.open);histories.forEach(d=>d.open=open);event.target.textContent=open?'收起历史正文':'展开历史正文';});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{search.value='';}));
document.getElementById('story-picker').addEventListener('change',e=>{location.hash='story-'+e.target.value;});
document.getElementById('current-picker').addEventListener('change',e=>{location.hash='current-'+e.target.value;});
window.addEventListener('hashchange',route);route();
</script></body></html>`;
fs.writeFileSync(path.join(output,'30篇文案版本与问题核对.html'),html);
const text=[
  '30篇绘本文案：版本、实际采用与逐篇内容问题',
  '2026-10-24；只核对，没有改稿、出图、重建PDF。没有找到逐篇人工定稿确认。',
  '主目录沿用v8的编号只为比较，不表示决定采用该稿。当前书架是旧序1–20。',
  '当前20篇中16篇与30篇稿有来源关联，4篇不在30篇稿内；30篇稿还有14篇未上架。',
  '现用全文和逐篇问题\n',
  ...current.flatMap(b=>{const r=rowData.find(x=>x.sourceNumber===b.number),e=extraOriginals.find(x=>x.number===b.number);return [`现用${b.number}《${b.title}》；第${b.pdf.volume}册PDF ${b.pdf.startPdfPage}–${b.pdf.endPdfPage}页`,...b.pages.map((p,i)=>`P${i+1} ${p.join(' / ')}`),...(r?r.notes.current:e.issues).map(n=>`${n.level}：${n.evidence}\n${n.problem}\n建议方向：${n.direction}`),''];}),
  '\n30篇候选逐篇版本与问题\n',
  ...rowData.flatMap(r=>[
    `第${r.number}篇《${r.title}》；来源旧序${r.sourceNumber}《${r.original.title}》`,
    r.current?`当前采用：第${r.current.number}篇《${r.current.title}》`:'当前未采用',
    `版本变化：${r.notes.delta}`,`内容判断：${r.notes.assessment}`,
    ...r.notes.revised.map(n=>`${n.level}：${n.evidence}\n${n.problem}\n建议方向：${n.direction}`),
    'v8完整正文：',...r.versions.at(-1).book.pages.map((p,i)=>`P${i+1} ${p.join(' / ')}`),'']),
  '各历史版本全文及20篇压缩稿全文请查看同目录HTML；结构化证据见JSON。',
  '以上均为待审意见，没有自动采用或改写任何一版。'
].join('\n');
fs.writeFileSync(path.join(output,'30篇文案核对-便于阅读.txt'),text);
const verify={currentStories:current.length,reviewedStories:rowData.length,currentOnly:currentOnly.map(b=>({number:b.number,title:b.title})),
  sharedBySource:currentMapped.length,identicalCurrentAndV8:currentTextsSame.map(r=>r.number),reviewedNotOnShelf:rowData.filter(r=>!r.current).map(r=>r.number),
  versions:versionsSummary.map(v=>({id:v.id,status:v.status,changed:v.changedSincePrevious})),
  pdfBodyPages:pdfChecks.reduce((s,b)=>s+b.pages.length,0),pdfAllLinesMatch:pdfMatch,pdfMismatches:pdfChecks.filter(b=>!b.match),
  sourceHashes:archive.sources.map(s=>({file:s.file,sha256:s.sha256})),files:['30篇文案版本与问题核对.html','30篇文案核对-便于阅读.txt','30篇版本与采用文案-证据.json']};
fs.writeFileSync(path.join(output,'audit-verification.json'),JSON.stringify(verify,null,2)+'\n');
console.log(JSON.stringify({...verify,sourceHashes:undefined,pdfMismatches:verify.pdfMismatches.length,output},null,2));
