'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const BASE='95c75a7ebeba7f052a6d227733dc48555f356d3c',norm=s=>s.replace(/\r\n?/g,'\n'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const specs={
  "scriptBlock": "c5965936f78578f53cbb8faa838dc2dd8b91733bb00c07642337ae8c8154e120",
  "scriptFunctions": [
    {
      "name": "ensureHighSchoolOffensivePlateAppearanceState",
      "sha256": "04ea5fb8c46a86b2488707b3ffad539fdb44ed6393fe567faf6be31035a9356e"
    },
    {
      "name": "resolveHighSchoolOffensiveDecision",
      "sha256": "e97e0ab515a238644b0fba4c3aa0e420d3b830140dc641069bdd3c258b754707"
    },
    {
      "name": "resolveSimulatedHighSchoolPlateAppearance",
      "sha256": "ec47169174754290c2e47ef19564b3355403cd980fd1cc6b74dada042555ede2"
    }
  ],
  "coreBlock": "151bcb2d4cdfadb4fecb5f664b8d9aa1eaffcd1a6987dbf63c72086ae543f1f8",
  "recordBlock": "2857b060876eedf69ec63001c89165e93fde1405d8290ea93d71fb6aa4d56bf9"
};
const recordEdits=[
['    const thirdStrikeIdentity = validateThirdStrikeCatchCredit(record, event, context);\n    if (thirdStrikeIdentity && record.eventRefs.some(ref => ref.defensivePlayIdentity === thirdStrikeIdentity)) return Object.freeze({ status: "duplicate", eventId });\n',''],
['    if (thirdStrikeIdentity) recordDefensivePlay(record, { ...event, fielderId: event.thirdStrikeCatch.execution.catcherId,\n      playerPosition: "捕手", catchResult: event.thirdStrikeCatch.execution, outsCreated: 1 }, context, eventId);\n',''],
['...(event.defensiveAttribution || flyoutIdentity || thirdStrikeIdentity ? { defensivePlayIdentity: event.defensiveAttribution?.playIdentity || flyoutIdentity || thirdStrikeIdentity } : {})','...(event.defensiveAttribution || flyoutIdentity ? { defensivePlayIdentity: event.defensiveAttribution?.playIdentity || flyoutIdentity } : {})']
];
function old(file){return norm(cp.execFileSync('git',['--no-optional-locks','show',BASE+':'+file],{encoding:'utf8',maxBuffer:16*1024*1024}));}
function stripBlock(text,startMarker,endMarker,expected) {
 assert.equal(text.split(startMarker).length,2,'missing/duplicate G1-C block');
 const start=text.indexOf(startMarker),end=text.indexOf(endMarker,start)+endMarker.length;
 assert(end>start);assert.equal(hash(text.slice(start,end)),expected,'G1-C reviewed block changed');
 return text.slice(0,start)+text.slice(end);
}
function stripScript(source){
 let text=norm(source);if(!text.includes('// G1-C bounded third-strike adapter.'))return text;
 const H=require('./pitch-production-source-scope.cjs'),parsed=H.readSource(text),baseline=H.readSource(old('script.js'));
 for(const item of specs.scriptFunctions){const f=parsed.get(item.name).source;assert.equal(hash(f),item.sha256,'G1-C shared wrapper differs: '+item.name);text=text.replace(f,baseline.get(item.name).source);}
 return stripBlock(text,'// G1-C bounded third-strike adapter.','// End G1-C bounded third-strike adapter.\n\n',specs.scriptBlock);
}
function stripCore(file,source){
 let text=norm(source);if(file!=='defensive-reach-secure-foundation.js'||!text.includes('// G1-C bounded third-strike catch.'))return text;
 text=stripBlock(text,'  // G1-C bounded third-strike catch.','  // End G1-C bounded third-strike catch.\n',specs.coreBlock);
 assert.equal(text.split('resolveOutfieldRetrieval, resolveThirdStrikeCatch });').length,2,'G1-C exact export');
 return text.replace('resolveOutfieldRetrieval, resolveThirdStrikeCatch });','resolveOutfieldRetrieval });');
}
function stripRecord(source){
 let text=stripBlock(norm(source),'  // G1-C: validate actual pitch possession','  // End G1-C third-strike validation.\n\n',specs.recordBlock);
 for(const [after,before]of recordEdits){assert.equal(text.split(after).length,2,'G1-C exact ledger anchor');text=text.replace(after,before);}
 return text;
}
function runSourceTests(){
 const cases=[['script.js',stripScript],['defensive-reach-secure-foundation.js',s=>stripCore('defensive-reach-secure-foundation.js',s)],['match-game-record.js',stripRecord]];
 let rejected=0;
 for(const [file,strip]of cases){
  const source=fs.readFileSync(file,'utf8');assert.equal(strip(source),old(file),'only exact G1-C change in '+file);
  const mutants=[source+'\n// unauthorized outside G1-C\n',source.replace(/G1-C/,'G1-X')];
  if(file==='script.js')mutants.push(source.replace('const thirdStrikeCatch = resolveHighSchoolThirdStrikeCatch(match, plateAppearanceState);','const thirdStrikeCatch = null;'));
  if(file==='match-game-record.js')mutants.push(source.replace('caught?.status === "completed"','true'));
  if(file.includes('reach-secure'))mutants.push(source.replace('const caught = margin >= 0;','const caught = true;'));
  for(const changed of mutants){assert.notEqual(changed,source);assert.throws(()=>assert.equal(strip(changed),old(file)));rejected++;}
 }
 return{status:'PASS',baseline:BASE,coreOwners:3,sharedWrappers:3,rejectedMutations:rejected,oldPinsRetained:true};
}
module.exports={stripScript,stripCore,stripRecord,runSourceTests};
if(require.main===module)console.log(JSON.stringify(runSourceTests()));
