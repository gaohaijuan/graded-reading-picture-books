const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),repo=path.join(root,'little-protagonist');
let p=fs.readFileSync(path.join(root,'tmp/pdfs/verify_volume_two_nine_pdfs.py'),'utf8');
p=p.replaceAll('九故事','十故事').replaceAll('two-nine','two-ten').replace("'paper','fruit','catbed']","'paper','fruit','catbed','sleepy']").replace("['books'][:9]","['books'][:10]");
fs.writeFileSync(path.join(root,'tmp/pdfs/verify_volume_two_ten_pdfs.py'),p);
const {listBooks}=require(path.join(repo,'miniprogram/lib/stories')),{defaultMembers,normalizeMembers}=require(path.join(repo,'miniprogram/lib/family')),{summarizeBooks}=require(path.join(repo,'miniprogram/lib/literacy'));
const members=normalizeMembers([{id:'child',included:true},{id:'dad',included:true},{id:'mom',included:true},{id:'grandpa',included:true},{id:'grandma',included:true},{id:'olderSister',included:true}]);
const data={default:summarizeBooks(listBooks({name:'CHILD',age:5,className:'大班'},defaultMembers(),{includeApproved:true})).slice(10),photo:summarizeBooks(listBooks({name:'CHILD',age:5,className:'大班'},members,{includeApproved:true})).slice(10)};
fs.writeFileSync(path.join(root,'browser-test/volume-two-ten-expected-literacy.json'),JSON.stringify(data,null,2));console.log(data.default.at(-1));
