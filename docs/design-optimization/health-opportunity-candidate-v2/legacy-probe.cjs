"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {env,setup,choose,toCallHome,saved,context,finish,sha}=require('./support.cjs');
const output=process.argv[2];if(!output||!/^legacy-[\w-]+\.json$/.test(output))throw Error('New legacy-*.json required');
const changes={complete:o=>{},debug:o=>{delete o.debug;},scoreBreakdown:o=>{delete o.debug.scoreBreakdown;},opportunitySeed:o=>{delete o.opportunitySeed;},readinessSnapshot:o=>{delete o.readinessSnapshot;}};
const h=setup('baseline',77881);choose(h,'high_school_long_bench',2);toCallHome(h);const parent=saved(h),rows=[];
for(const [field,mutate]of Object.entries(changes))for(const label of ['baseline','candidate']){
 const c=context(label),storage=parent.storage.map(([k,v])=>{if(k!=='baseballLifeRpgSave')return[k,v];const p=JSON.parse(v);mutate(p.highSchoolNextOpportunity);Object.assign(p.body,{fatigue:20,pain:20,injuryRisk:20});return[k,JSON.stringify(p)];});
 const original=JSON.parse(storage.find(x=>x[0]==='baseballLifeRpgSave')[1]).highSchoolNextOpportunity;
 for(const[k,v]of storage)c.storage.set(k,v);
 const errors=[];c.context.console={...console,error:e=>errors.push(String(e))};const pre=c.run('JSON.stringify(player)');let loadThrown=null;try{c.run('loadGame();stopHighSchoolMatchPlayback();');}catch(e){loadThrown=String(e);}
 const notice=c.nodes.get('changeLog')?.innerHTML||'',loaded=/進度讀取完成/.test(notice);const row={field,label,loaded,notice,loadThrown,loadErrors:errors,liveMutatedOnLoad:pre!==c.run('JSON.stringify(player)'),loadedProgress:c.json('({event:getCurrentEventId(),step:player.highSchoolStep,matchId:player.highSchoolMatch.id})')};
 if(loaded){c.run(`__hcSeed=${parent.rng.seed};__hcDraws=${parent.rng.draws};`);const before=c.json('player.highSchoolNextOpportunity');let error=null;try{choose(c,'high_school_call_home');}catch(e){error=String(e);}
  Object.assign(row,{confirmationError:error,progress:c.json('({event:getCurrentEventId(),step:player.highSchoolStep,matchId:player.highSchoolMatch.id,isTransitioning})'),opportunityPreserved:JSON.stringify(before)===c.run('JSON.stringify(player.highSchoolNextOpportunity)'),identity:c.json('({decisionId:player.highSchoolNextOpportunity?.decisionId,opportunitySeed:player.highSchoolNextOpportunity?.opportunitySeed,hash:player.highSchoolNextOpportunity?.debug?.opportunityHash,variation:player.highSchoolNextOpportunity?.debug?.scoreBreakdown?.deterministicVariation,simulationSeed:player.highSchoolMatch.simulationSeed})')});
  if(!error&&row.progress.matchId===original.matchId){try{const r=finish(c);row.completed=true;row.recordHash=sha(r.record);row.PA=r.exposure.plateAppearances;}catch(e){row.matchError=String(e);}}
 }
 rows.push(row);console.log(JSON.stringify({field,label,loaded,error:row.confirmationError,progress:row.progress,completed:row.completed}));
}
fs.writeFileSync(path.join(__dirname,output),JSON.stringify({base:env.base,seed:77881,source:'One legal baseline N+1 pre-telephone Save, one omission per copy; original loadGame/choose/confirmation/playback owners.',rows},null,2)+'\n',{flag:'wx'});
