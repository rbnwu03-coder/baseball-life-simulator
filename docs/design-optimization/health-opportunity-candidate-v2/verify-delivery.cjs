"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const env=JSON.parse(fs.readFileSync(process.env.HEALTH_OPPORTUNITY_ENV||path.join(__dirname,'../health-opportunity-candidate-v1/environment.json'))),summary=require('./summary.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(hash(fs.readFileSync(path.join(env.candidate,'script.js'))),summary.candidateScriptSha256);assert.equal(hash(fs.readFileSync(path.join(__dirname,'candidate.patch'))),summary.candidatePatchSha256);
cp.execFileSync('git',['-c','safe.directory='+env.baseline,'-c','core.autocrlf=false','apply','--check',path.join(__dirname,'candidate.patch')],{cwd:env.baseline});
cp.execFileSync('git',['-c','safe.directory='+env.candidate,'-c','core.autocrlf=false','diff','--check'],{cwd:env.candidate});
console.log({scriptAndPatchHashes:'PASS',applyCheckAgainstBaseline:'PASS',diffWhitespace:'PASS'});
