const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../little-protagonist');
function edit(file,pairs){let s=fs.readFileSync(path.join(root,file),'utf8');for(const [a,b]of pairs){if(!s.includes(a))throw Error(file+': '+a);s=s.replaceAll(a,b);}fs.writeFileSync(path.join(root,file),s);}
edit('tests/print-service.browser.cjs',[
 ['assert.match(text,/20 个故事/);assert.match(text,/第1册 · 10个故事/);assert.match(text,/完整每级计划 30 个故事，每 10 个装订一册，共 3 册/);','assert.match(text,/第1册 · 15个故事/);assert.match(text,/当前第1级采用选定的15个故事，合订1册/);'],
 ['assert.match(text,/第2册 · 10个故事/);assert.equal(await page.locator(\'.ls-print-volume li\').count(),20);',"assert.equal(await page.locator('.ls-print-volume').count(),1);assert.equal(await page.locator('.ls-print-volume li').count(),15);"],
 ['data-id="intro"','data-id="intro-complete"'],
 ['truthful twenty-story sample/two volumes/30-story policy','versioned fifteen-story single-volume edition']
]);
edit('tests/print-service-orders.browser.cjs',[
 ["path.join(root,'preview/qa/print-service')","path.join(root,'../output/browser-trial-15-20261027/regression')"],
 ["fs.readFileSync(path.join(root,'.local/face-fixtures/portrait.jpg'))","fs.readFileSync(process.env.FACE_TEST_PORTRAIT||path.join(root,'../browser-test/portrait.jpg'))"],
 ["{includeApproved:true}","{currentEdition:true}"],
 ["detail.items[0].book,'level-1'","detail.items[0].book,'level-1-fifteen-v1'"],
 ["detail.printPlan.storyCount,6","detail.printPlan.storyCount,15"],
 ["detail.printPlan.sample,true","detail.printPlan.sample,false"],
 ['/6个故事 · 1册/','/15个故事 · 1册/']
]);
console.log('Current print UI and end-to-end regression expectations updated.');
