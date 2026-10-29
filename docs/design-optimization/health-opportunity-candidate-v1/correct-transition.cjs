"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const env=JSON.parse(fs.readFileSync(path.join(__dirname,'environment.json'))),file=path.join(env.candidate,'script.js');
const diff=cp.execFileSync('git',['-c','safe.directory='+env.candidate,'diff','--','script.js'],{cwd:env.candidate});
fs.writeFileSync(path.join(__dirname,'initial-candidate.patch'),diff,{flag:'wx'});
const old='    // The call-home choice is complete. Lock N+1 before rendering its match event.\n    if (completedEventId === "high_school_call_home") confirmHighSchoolYearOneFollowupOpportunity();\n    player.highSchoolStep += 1;';
let source=fs.readFileSync(file,'utf8');assert.equal(source.split(old).length,2);
source=source.replace(old,'    player.highSchoolStep += 1;\n    // The call-home choice is complete. Lock N+1 before rendering its match event.\n    if (completedEventId === "high_school_call_home") confirmHighSchoolYearOneFollowupOpportunity();');
fs.writeFileSync(file,source);console.log('Corrected N+1 transition: advance event before schedule eligibility evaluation.');
