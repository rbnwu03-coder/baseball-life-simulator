"use strict";
const observerProgram=String.raw`
  if(typeof reachProbe==='undefined')globalThis.reachProbe={ordinal:0,counts:{},calls:[],installations:[]};
  function reachSnapshot(value){return JSON.parse(JSON.stringify(value,(key,v)=>v===undefined?{__witnessType:'undefined'}:typeof v==='function'?{__witnessType:'function-reference',name:v.name}:typeof v==='number'&&!Number.isFinite(v)?{__witnessType:'non-finite-number',value:String(v)}:v));}
  function reachWrap(label,original){
    return function(...args){
      const counts=reachProbe.counts[label]||(reachProbe.counts[label]={wrapperInvocations:0,originalInvocations:0,returns:0,throws:0});
      counts.wrapperInvocations++;const enter=++reachProbe.ordinal,input=reachSnapshot(args);
      let result,error;
      try{counts.originalInvocations++;result=Reflect.apply(original,this,args);counts.returns++;}
      catch(e){counts.throws++;error=e;}
      const exit=++reachProbe.ordinal,target=typeof controlledAdapter==='undefined'?null:controlledAdapter.witnesses[0]?.truth?.identity;
      const identities=[args[0]?.physicalTruth?.identity,args[0]?.physicalIdentity,args[1]?.identity,result?.physicalIdentity,result?.physicalTruth?.identity,result?.battedBallPhysicalTruth?.identity,result?.reachResolution?.physicalIdentity];
      if(target&&identities.includes(target))reachProbe.calls.push({owner:label,enter,exit,physicalIdentity:target,input,output:error?null:reachSnapshot(result),exception:error?{name:error.name,message:error.message}:null,exactlyOneOriginalCall:true});
      if(error)throw error;
      return result;
    };
  }
  function reachInstallApi(name,methods){
    const original=globalThis[name],replacement={...original},unchanged=[];
    for(const method of methods){if(typeof original[method]!=='function')throw Error('Missing observer boundary '+name+'.'+method);replacement[method]=reachWrap(name+'.'+method,original[method]);}
    for(const key of Object.keys(original))if(!methods.includes(key))unchanged.push({key,sameReference:replacement[key]===original[key]});
    globalThis[name]=Object.freeze(replacement);reachProbe.installations.push({name,methods,unchangedExports:unchanged});
  }
`;
const hooks=Object.freeze({
 'defensive-opportunity-foundation.js':"reachInstallApi('DefensiveOpportunityFoundation',['resolveDefensiveOpportunity']);",
 'defensive-reach-secure-foundation.js':"reachInstallApi('DefensiveReachSecureFoundation',['resolveReach','projectAccess','resolveSecure']);",
 'batted-ball-ground-defense.js':"reachInstallApi('BattedBallGroundDefense',['resolveGroundBallDefensiveAccess','buildGroundBallDefensiveOpportunity']);",
 'offensive-plate-approach.js':"reachInstallApi('OffensivePlateApproach',['simulatePlateAppearance']);",
 'script.js':"for(const name of ['getHighSchoolDefensiveOpportunity','getHighSchoolReachAccess','getHighSchoolPhysicalDefensePlayerContext','ensureHighSchoolOrdinaryGroundBallInPlayHandoff']){const original=globalThis[name];if(typeof original!=='function')throw Error('Missing script boundary '+name);globalThis[name]=reachWrap('script.'+name,original);}reachProbe.installations.push({name:'script globals',methods:['getHighSchoolDefensiveOpportunity','getHighSchoolReachAccess','getHighSchoolPhysicalDefensePlayerContext','ensureHighSchoolOrdinaryGroundBallInPlayHandoff']});"
});
module.exports={observerProgram,hooks};
