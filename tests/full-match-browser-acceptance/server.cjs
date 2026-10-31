"use strict";
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/design-optimization/full-match-browser-2026-10-31');
fs.mkdirSync(out, {recursive:true});
const git = (...args) => execFileSync('git', args, {cwd:root,encoding:'utf8'}).trim();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const files = ['index.html','script.js','player.js','save.js','application-controller.js','competition-rules.js','team-roster-foundation.js','match-game-record.js','offensive-bunt-execution.js','offensive-bunt-defensive-handoff.js','match-pitch-decision-ui.js'];
function version() {return {head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),root,dirty:git('status','--porcelain'),hashes:Object.fromEntries(files.map(file=>[file,hash(file)]))};}
const baseline = path.join(out,'baseline.json');
if (!fs.existsSync(baseline)) fs.writeFileSync(baseline,JSON.stringify({...version(),refs:git('show-ref','--heads'),worktrees:git('worktree','list','--porcelain')},null,2));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  try {
    const route = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(req.method==='POST'&&route.startsWith('/__evidence/')) {
      const name=route.slice('/__evidence/'.length);
      if(!/^[a-z0-9-]+\/[a-z0-9.-]+$/.test(name)) throw Error('evidence path');
      const destination=path.join(out,name);fs.mkdirSync(path.dirname(destination),{recursive:true});
      const chunks=[];req.on('data',b=>chunks.push(b));req.on('end',()=>{
        const bytes=Buffer.concat(chunks);
        if(name.endsWith('.ndjson'))fs.appendFileSync(destination,bytes);else fs.writeFileSync(destination,bytes);
        res.end('saved');
      });return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    if (route==='/__version') {res.setHeader('Content-Type',mime['.json']);return res.end(JSON.stringify(version()));}
    if(route==='/__fixture') {
      res.setHeader('Content-Type',mime['.html']);
      return res.end(fs.readFileSync(path.join(root,'index.html'),'utf8').replace('</body>','<script src="/tests/full-match-browser-acceptance/fixture.js"></script></body>'));
    }
    const file = path.resolve(root, route==='/'?'index.html':'.'+route);
    if (!file.startsWith(root+path.sep) || route.includes('.git')) throw Error('path');
    const bytes=fs.readFileSync(file);
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('X-Source-SHA256',crypto.createHash('sha256').update(bytes).digest('hex'));
    res.end(bytes);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.argv[2]||8770),'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+(process.argv[2]||8770),...version()})));
