const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const browser={};
for(const tag of ['default','photo','mobile']){
 const rows=load('browser-test/books-17-19-'+tag+'-check.json');
 assert.equal(rows.length,24);assert(rows.every(r=>r.dataset.artState==='ready'&&!r.overflow));
 const scales=[...new Set(rows.map(r=>r.dataset.portraitScale).filter(Boolean))];assert.equal(scales.length,1);
 assert(rows.every(r=>r.textRect.left>=r.paper.left&&r.textRect.right<=r.paper.right&&r.textRect.bottom<=r.paper.bottom));
 const actorIds={};for(const r of rows){if(r.dataset.pose==='none')continue;const ids=actorIds[r.dataset.pose]||=new Set();ids.add(r.dataset.actorCacheId);}
 browser[tag]={pages:24,allArtworkReady:true,overflow:0,textInside:true,portraitScales:scales,actorIdsByPose:Object.fromEntries(Object.entries(actorIds).map(([k,v])=>[k,[...v]]))};
}
const normal=load('output/pdf/第2册九故事合集-实际PDF检查.json').summary;
const photo=load('output/pdf/第2册九故事真人长名字-实际PDF检查.json').summary;
for(const pdf of [normal,photo]){assert.equal(pdf.pages,80);assert.equal(pdf.body_pages,68);assert.deepEqual(pdf.errors,[]);assert(pdf.fonts.every(f=>f.embedded));assert.deepEqual(pdf.chapters.map(c=>c.start_folio),[1,8,17,26,33,42,51,60,69]);}
const press=load('output/pdf/第2册九故事-逐层像素与印厂包检查.json');assert.equal(press.reading_pages,80);assert.equal(press.quality.minimumMeasuredPpi,243);assert(press.quality.completeLayerAudit);
const last=load('browser-test/books-17-19-photo-check.json').at(-1);
const report={date:'2026-10-24',newBooks:['小纸片飞了','大果子和小果子','小猫的床'],newPages:24,shelfBooks:19,imageGeneration:{mode:'built-in imagegen',imageApi:false,promptManifest:'../little-protagonist/content/books-17-19-art-provenance.json',newAssets:10,reusedAssets:14,lossless:true},browser,pdf:{default:normal,photo},print:{minimumNativePpi:243,native300Ppi:false,completeLayerAudit:true,...press.pdfs},validation:{fullUnitTestsPassed:394,postAdjustmentRelevantTestsPassed:29,javascriptFilesChecked:46,completionAndRestartBooks:3},profileRestored:{name:'小石头',head:'default illustrated',familyMembers:3,age:5,className:'大班'},viewportReset:true,performance:{portraitProcessing:last.photoTiming,sessionCumulative:last.session,limitations:'Local Windows localhost with warm caches, session counters include covers/repeated renders. Draw timing is JavaScript submission, not GPU completion. PNG encoding measures portrait output. Narrow viewport is simulated, not a physical-device benchmark.'}};
fs.writeFileSync(path.join(root,'browser-test/books-17-19-final-check.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pages:80,bodyPages:68,newBodyPages:24,browserRuns:3,minimumNativePpi:243,errors:[]}));
