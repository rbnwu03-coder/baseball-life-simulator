'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-capture.cjs'),P='ss-strategic-scenario-fixture-pa-ledger-integration-v0.1';
for(const part of ['observer','adapter']){const prior=C.readSource('docs/ss-reachable-controlled-scenario-v0.1-'+part+'.cjs');let next=prior.replaceAll('ss-reachable-controlled-scenario-v0.1',P);if(part==='adapter'){
 next=next.replace("if(match.outs<0||match.outs>=3)","if(typeof setupLedger==='undefined'||!setupLedger.complete||match.outs!==1||!match.runners[0]||match.runners[1]||match.runners[2])");
 const anchor='const code=before+';assert(next.includes(anchor));next=next.replace(anchor,'const allowed=C.runtimeWhitelist();const guard="if(!"+JSON.stringify(allowed)+".includes(file))throw Error(\\\"Unlisted runtime file\\\");";const guarded=guard+before;const code=guarded+');
 }
 fs.writeFileSync('docs/'+P+'-'+part+'.cjs',next,{flag:'wx'});
}
const old=C.readSource('docs/ss-reachable-controlled-scenario-v0.1-proof.cjs');
const literal=old.slice(old.indexOf('const program=')+'const program='.length,old.lastIndexOf('\n\nif(require.main===module)')).trim().replace(/;$/,'');
let program=JSON.parse(literal);
program=program.replace('controlledAdapter.armed=true;','controlledAdapter.armed=false;');
const anchor='proof.ticks++;const before=state()';assert(program.includes(anchor));
program=program.replace(anchor,"proof.ticks++;if(!setupLedger.complete&&ledgerWindow(m)){proof.setup=setupLedger;ledgerBuild(m);controlledAdapter.armed=true;}const before=state()");
program=program.replace('proof.reachProbe=copy(reachProbe); proof.adapter=copy(controlledAdapter);','proof.setup=copy(setupLedger);proof.reachProbe=copy(reachProbe); proof.adapter=copy(controlledAdapter);');
const B=require('./'+P+'-builder.cjs');program=program.replace('  globalThis.saved=JSON.parse(checkpointJSON);',B.builderProgram+'\n  globalThis.saved=JSON.parse(checkpointJSON);');
fs.writeFileSync('docs/'+P+'-program.json',JSON.stringify({program},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({programSha256:C.hash(program),gameplayExecutions:0}));