"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),env=require('../health-opportunity-candidate-v1/environment.json'),parent='fcd9135839eaf973297e0ceffc48ce47bc8b2ec4';
const git=(where,...a)=>cp.execFileSync('git',['-c','safe.directory='+where,'-c','core.autocrlf=false',...a],{cwd:where,maxBuffer:16e6}).toString().trim(),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(git(env.candidate,'rev-parse','HEAD'),parent);assert.equal(git(env.candidate,'status','--porcelain'),'');
const files=git(root,'ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith('docs/design-optimization/health-opportunity-candidate-v3/'));
fs.writeFileSync(path.join(__dirname,'preservation-before.json'),JSON.stringify({parent,head:git(root,'rev-parse','HEAD'),branch:git(root,'branch','--show-current'),hashes:Object.fromEntries(files.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))])),candidateScript:hash(fs.readFileSync(path.join(env.candidate,'script.js')))},null,2)+'\n',{flag:'wx'});
fs.copyFileSync(path.join(root,'docs/design-optimization/12-high-school-health-opportunity-candidate.md'),path.join(__dirname,'report-before.md'),fs.constants.COPYFILE_EXCL);console.log({parent,preserved:files.length});
