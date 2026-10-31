'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/design-optimization/full-match-browser-2026-10-31');
const suites=['tests/full-match-browser-acceptance/targeted-regression.cjs','tests/g3-a-pc-match-shell-test.cjs','tests/catcher-event-context-consistency-test.cjs','tests/match-situation-lifecycle-test.js','tests/career-save-admission-test.js'];
const checks=[];
for(const file of suites){const result=cp.spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:60000});
  const log=path.basename(file)+'.log';fs.writeFileSync(path.join(out,log),(result.stdout+(result.stderr?'\n'+result.stderr:'')).trimEnd()+'\n');
  checks.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),exit:result.status,error:result.error?.message,log});console.log(file+': '+result.status);}
for(const file of ['script.js','save.js','match-pitch-decision-ui.js','tests/full-match-browser-acceptance/server.cjs','tests/full-match-browser-acceptance/fixture.js']){
  const r=cp.spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});checks.push({check:'syntax',file,exit:r.status,error:r.stderr});}
const whitespace=cp.spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8'});checks.push({check:'git diff --check',exit:whitespace.status,stderr:whitespace.stderr});
fs.writeFileSync(path.join(out,'node-verification.json'),JSON.stringify({node:process.version,checks},null,2));
if(checks.some(x=>x.exit!==0))process.exitCode=1;
