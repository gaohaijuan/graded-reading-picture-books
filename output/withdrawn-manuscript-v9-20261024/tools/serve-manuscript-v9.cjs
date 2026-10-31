'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../output/manuscript-revision-v9');
const routes={'/':['30篇文案-修订第1版-待确认.html','text/html; charset=utf-8'],'/manuscript.txt':['30篇文案-修订第1版-全文.txt','text/plain; charset=utf-8']};
http.createServer((request,response)=>{
  const entry=routes[request.url.split('?')[0]];
  if(!entry||!['GET','HEAD'].includes(request.method)){response.writeHead(404);response.end();return;}
  response.writeHead(200,{'Content-Type':entry[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});
  if(request.method==='HEAD')response.end();else fs.createReadStream(path.join(root,entry[0])).pipe(response);
}).listen(4175,'127.0.0.1',()=>console.log('30篇文案本轮修订第1版：http://127.0.0.1:4175/'));
