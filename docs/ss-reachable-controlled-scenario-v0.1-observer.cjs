"use strict";
const prior=require('./ss-reach-access-rejection-proof-v0.1-observer.cjs');
// Read-only wrappers retain original calls/results; nested execution owners
// inherit the actual physical context from their already-observed parent.
let observerProgram=prior.observerProgram
 .replace('ordinal:0,counts:{}','ordinal:0,stack:[],counts:{}')
 .replace('const enter=++reachProbe.ordinal,input=reachSnapshot(args);',"const enter=++reachProbe.ordinal,input=reachSnapshot(args),known=typeof controlledAdapter==='undefined'?null:controlledAdapter.witnesses[0]?.truth?.identity,argumentIds=[args[0]?.physicalTruth?.identity,args[0]?.physicalIdentity,args[1]?.identity,args[0]?.groundBallInPlayState?.physicalTruth?.identity,args[0]?.groundBallDefensiveContext?.physicalTruth?.identity,args[0]?.opportunity?.physicalIdentity,args[0]?.input?.physicalIdentity],context=known&&(argumentIds.includes(known)||reachProbe.stack.at(-1)?.physicalIdentity===known)?known:null;reachProbe.stack.push({owner:label,physicalIdentity:context});")
 .replace('const exit=++reachProbe.ordinal,target=',"const inherited=reachProbe.stack.pop().physicalIdentity;const exit=++reachProbe.ordinal,target=")
 .replace('if(target&&identities.includes(target))',"if(target&&(identities.includes(target)||inherited===target))");
const hooks={...prior.hooks,
 'defensive-decision-throw-foundation.js':"reachInstallApi('DefensiveDecisionThrowFoundation',['buildDecisionOpportunity','selectDefensiveRoute','resolveThrow']);",
 'defensive-runner-throw-settlement-foundation.js':"reachInstallApi('DefensiveRunnerThrowSettlementFoundation',['resolveTiming','deriveSettlement']);",
 'force-advancement.js':"reachInstallApi('ForceAdvancement',['settleForceAdvancement']);"
};
hooks['script.js']="for(const name of ['getHighSchoolDefensiveOpportunity','getHighSchoolReachAccess','getHighSchoolPhysicalDefensePlayerContext','ensureHighSchoolOrdinaryGroundBallInPlayHandoff','classifyHighSchoolMatchDefensiveOpportunity','buildHighSchoolShortstopExecution','applyInfieldResolutionToHighSchoolMatch']){const original=globalThis[name];if(typeof original!=='function')throw Error('Missing script boundary '+name);globalThis[name]=reachWrap('script.'+name,original);}reachProbe.installations.push({name:'script globals',methods:['getHighSchoolDefensiveOpportunity','getHighSchoolReachAccess','getHighSchoolPhysicalDefensePlayerContext','ensureHighSchoolOrdinaryGroundBallInPlayHandoff','classifyHighSchoolMatchDefensiveOpportunity','buildHighSchoolShortstopExecution','applyInfieldResolutionToHighSchoolMatch']});";
module.exports={observerProgram,hooks};
