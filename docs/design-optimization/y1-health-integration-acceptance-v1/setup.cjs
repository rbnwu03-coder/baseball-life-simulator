"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),base='33abdcb151d0a6becef640aab778a87ce3cbec68',candidate='3e14ca8dfb907ab4d752d50fd5a0577c9b223330',preferred='integration/y1-health-opportunity-2026-10-29';
const git=(where,...a)=>cp.execFileSync('git',['-c','safe.directory='+where,'-c','core.autocrlf=false',...a],{cwd:where,maxBuffer:20e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).toString().trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(git(root,'rev-parse','HEAD'),base);assert.equal(git(root,'cat-file','-t',candidate),'commit');git(root,'merge-base','--is-ancestor',base,candidate);
const files=git(root,'ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith('docs/design-optimization/y1-health-integration-acceptance-v1/'));
fs.writeFileSync(path.join(__dirname,'preservation-before.json'),JSON.stringify({head:git(root,'rev-parse','HEAD'),branch:git(root,'branch','--show-current'),index:git(root,'diff','--cached','--name-only'),hashes:Object.fromEntries(files.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]))},null,2)+'\n',{flag:'wx'});
const remote=git(root,'ls-remote','--heads','origin','refs/heads/'+preferred+'*').split('\n').filter(Boolean).map(l=>l.split(/\s+/));
const local=git(root,'for-each-ref','--format=%(refname:short) %(objectname)','refs/heads').split('\n').map(l=>l.split(' '));
const conflicts=[];let branch=preferred,n=1;
while(local.some(([b])=>b===branch)||remote.some(([,r])=>r==='refs/heads/'+branch)){conflicts.push({branch,local:local.find(([b])=>b===branch)?.[1]||null,remote:remote.find(([,r])=>r==='refs/heads/'+branch)?.[0]||null});branch=preferred+'-'+(++n);}
let checkout=path.join(os.tmpdir(),'baseball-y1-health-integration-2026-10-29'),i=1;while(fs.existsSync(checkout))checkout=path.join(os.tmpdir(),'baseball-y1-health-integration-2026-10-29-'+(++i));
git(root,'worktree','add','-b',branch,checkout,base);const before=git(checkout,'rev-parse','HEAD');git(checkout,'merge','--ff-only',candidate);const after=git(checkout,'rev-parse','HEAD');assert.equal(before,base);assert.equal(after,candidate);assert.equal(git(checkout,'status','--porcelain'),'');
fs.writeFileSync(path.join(__dirname,'environment.json'),JSON.stringify({base,candidate,branch,checkout,preferred,conflicts,fastForward:{before,after,noMergeCommit:true},node:process.version,remoteBefore:remote},null,2)+'\n',{flag:'wx'});console.log({base,candidate,branch,checkout,preserved:files.length,fastForward:true});
