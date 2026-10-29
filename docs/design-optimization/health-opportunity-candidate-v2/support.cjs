"use strict";
// Reuse the exact formal-entry/engine drivers from v1 without running its suite.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const env=JSON.parse(fs.readFileSync(process.env.HEALTH_OPPORTUNITY_ENV||path.join(__dirname,'../health-opportunity-candidate-v1/environment.json'))),spec=require('../health-opportunity-candidate-v1/spec.json');
const source=fs.readFileSync(path.join(__dirname,'../health-opportunity-candidate-v1/formal-verification.cjs'),'utf8'),start=source.indexOf('function context(label)'),end=source.indexOf('for(const seed of spec.seeds)');
assert(start>0&&end>start);
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
module.exports={env,spec,sha,...new Function('require','path','env','spec','assert','sha',source.slice(start,end)+'\nreturn {context,choose,setup,body,snapshot,identity,nonHealth,healthCheck,finish,toCallHome,saved,load,lockedReads};')(require,path,env,spec,assert,sha)};
