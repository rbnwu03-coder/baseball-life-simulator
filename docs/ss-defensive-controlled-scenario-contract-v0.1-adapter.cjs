"use strict";
const path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const C=require('./ss-defensive-controlled-scenario-contract-v0.1-capture.cjs');
// Installed before consumers capture the frozen Physical API. Only rolls at
// its input boundary differ; the original producer computes every output.
const adapterProgram=String.raw`
  globalThis.controlledAdapter={armed:false,used:false,witnesses:[],unchangedExports:[]};
  (()=>{
    const original=BattedBallPhysical;
    const replacement={...original,resolveBattedBallPhysicalTruth(input={}){
      const a=controlledAdapter,match=typeof m==='undefined'?null:m;
      const live=a.armed&&!a.used&&match&&player.highSchoolMatch===match
        &&match.playerEntryCompleted&&match.offenseTeam===getHighSchoolOpponentTeamSide(match)
        &&match.defenseTeam===getHighSchoolPlayerTeamSide(match)
        &&TeamRosterFoundation.getCurrentDefender(match.rosters[match.defenseTeam],'SS')?.id==='player'
        &&String(input.identity||'').includes('|ordinary-contact|');
      if(!live)return original.resolveBattedBallPhysicalTruth(input);
      if(match.inning!==7||match.half!=='上'||match.outs!==0||match.runners.some(Boolean))
        throw new Error('Fixed controlled starting state not reached; no alternate scenario');
      const valid=TeamRosterFoundation.validateActiveDefense(match.rosters[match.defenseTeam]);
      if(!valid.ok||getHighSchoolMatchStateIntegrityIssues(match).length)
        throw new Error('Illegal controlled input boundary');
      const before=JSON.stringify(player),effective={...input,rolls:{...(input.rolls||{}),contactQuality:.65,ballType:.1,pace:.68,direction:.05,depth:0}};
      a.used=true;
      const truth=original.resolveBattedBallPhysicalTruth(effective);
      a.witnesses.push({scenarioId:'ss-controlled-ground-v0.1',before:{matchId:match.id,eventId:getCurrentEventId(),inning:match.inning,half:match.half,outs:match.outs,runners:match.runners.slice(),scores:{...match.scores},offenseTeam:match.offenseTeam,defenseTeam:match.defenseTeam,currentBatter:match.currentBatter,actualSS:TeamRosterFoundation.getCurrentDefender(match.rosters[match.defenseTeam],'SS').id,entryCompleted:match.playerEntryCompleted,activeDefense:valid},originalInput:JSON.parse(JSON.stringify(input)),effectiveInput:JSON.parse(JSON.stringify(effective)),truth:JSON.parse(JSON.stringify(truth)),playerUnchanged:before===JSON.stringify(player),normalized:!!original.normalizeBattedBallPhysicalTruth(truth)});
      return truth;
    }};
    controlledAdapter.unchangedExports=Object.keys(original).filter(k=>k!=='resolveBattedBallPhysicalTruth').map(key=>({key,sameReference:replacement[key]===original[key]}));
    globalThis.BattedBallPhysical=Object.freeze(replacement);
  })();
`;
function profile(){
 const file='tests/helpers/canonical-match-contract-context.cjs',source=C.readSource(file);
 const before='vm.runInContext(source.toString("utf8"), context, { filename: file });';
 assert.equal(source.split(before).length,2);
 const after=before+'\n    if (file === "batted-ball-physical.js") vm.runInContext('+JSON.stringify(adapterProgram)+', context, { filename: "controlled-physical-input-adapter" });';
 return {file,source,adapted:source.replace(before,after),before,after};
}
function createContext(){
 const p=profile(),file=path.join(C.root,p.file),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(p.adapted,file);return m.exports.createContext();
}
module.exports={adapterProgram,profile,createContext};
