'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const report = path.resolve(__dirname, '../output/manuscript-audit/30篇文案版本与问题核对.html');
http.createServer((request, response) => {
  if (!['GET','HEAD'].includes(request.method) || request.url.split('?')[0] !== '/') {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});
  if(request.method==='HEAD') response.end(); else fs.createReadStream(report).pipe(response);
}).listen(4174,'127.0.0.1',()=>console.log('文案核对报告：http://127.0.0.1:4174/'));
