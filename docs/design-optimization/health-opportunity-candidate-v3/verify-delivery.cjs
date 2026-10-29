"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const env=JSON.parse(fs.readFileSync(process.env.HEALTH_OPPORTUNITY_ENV||path.join(__dirname,'../health-opportunity-candidate-v1/environment.json'))),summary=require('./summary.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(hash(fs.readFileSync(path.join(env.candidate,'script.js'))),summary.candidateScriptSha256);assert.equal(hash(fs.readFileSync(path.join(__dirname,'retry.patch'))),summary.incrementalPatchSha256);assert.equal(hash(fs.readFileSync(path.join(__dirname,'candidate.patch'))),summary.fullCandidatePatchSha256);
const git=(where,...a)=>cp.execFileSync('git',['-c','safe.directory='+where,'-c','core.autocrlf=false',...a],{cwd:where});
git(env.baseline,'apply','--check',path.join(__dirname,'candidate.patch'));git(env.candidate,'apply','--reverse','--check',path.join(__dirname,'retry.patch'));git(env.candidate,'diff','--check');console.log({hashes:'PASS',fullPatchAppliesToProductionBase:'PASS',incrementalPatchMatchesWorkingCode:'PASS',whitespace:'PASS'});
