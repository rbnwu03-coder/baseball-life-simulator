"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),env=require('../health-opportunity-candidate-v1/environment.json');
const git=(where,...args)=>cp.execFileSync('git',['-c','safe.directory='+where,'-c','core.autocrlf=false',...args],{cwd:where,maxBuffer:16e6});
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const files=git(root,'ls-files','--cached','--others','--exclude-standard','-z').toString().split('\0').filter(p=>p&&!p.startsWith('docs/design-optimization/health-opportunity-candidate-v2/'));
fs.writeFileSync(path.join(__dirname,'preservation-before.json'),JSON.stringify({head:git(root,'rev-parse','HEAD').toString().trim(),branch:git(root,'branch','--show-current').toString().trim(),hashes:Object.fromEntries(files.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))])),candidateScript:hash(fs.readFileSync(path.join(env.candidate,'script.js')))},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(__dirname,'candidate-before.patch'),git(env.candidate,'diff','--binary','--','script.js'),{flag:'wx'});console.log({preserved:files.length});
