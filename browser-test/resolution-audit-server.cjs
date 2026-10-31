// Local QA surface: run the existing raster-sampling audit through Browser MCP.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const project = path.resolve(__dirname, '../little-protagonist');
const preview = path.join(project, 'preview');
const audit = fs.readFileSync(path.join(project, 'scripts/audit-print-resolution.cjs'), 'utf8').replace(/\r\n/g, '\n');
const hook = audit.slice(audit.indexOf('const hook=`') + 'const hook=`'.length, audit.indexOf('`;\n(async()=>'));
if (!hook.includes('window.__auditPrintSources=async')) throw Error('Audit hook not found');
const controls = `
window.addEventListener('load',()=>{
 const button=document.createElement('button');button.textContent='运行A5原素材分辨率检查';
 button.style.cssText='display:block;padding:16px;margin:16px auto;font-size:18px';
 document.body.prepend(button);
 button.onclick=async()=>{
  button.disabled=true;button.textContent='正在检查全部插画图层…';
  const report=document.createElement('pre');document.body.append(report);
  try {const result=await window.__auditPrintSources();report.textContent=JSON.stringify(result);button.textContent='检查完成';}
  catch(error){report.textContent=String(error);button.textContent='检查失败';}
 };
});`;
const html = fs.readFileSync(path.join(preview, 'index.html'), 'utf8')
 .replace('  const { draw } = shared.art;', () => '  const { draw } = shared.art;' + hook + controls);
http.createServer((request,response)=>{
 let pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
 if(pathname==='/'){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return response.end(html);}
 const file=path.resolve(preview,'.'+pathname);
 if(!file.startsWith(preview+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);return response.end();}
 const types={'.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.json':'application/json','.webp':'image/webp','.png':'image/png'};
 response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(response);
}).listen(4174,'127.0.0.1',()=>console.log('Resolution audit ready: http://127.0.0.1:4174'));
