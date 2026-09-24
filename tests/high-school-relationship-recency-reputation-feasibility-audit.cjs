"use strict";
// Observation only. This module is never loaded by production and applies no factors.
const Network=require('../high-school-exchange-network');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const signature=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function inspectLedger(state,position) {
  const records=Network.normalizeState(state).evidence;
  return records.map(e=>({evidenceId:e.evidenceId,evidenceType:e.evidenceType,
    temporalAuthority:'EXPLICIT_TEMPORAL_AUTHORITY',year:e.careerYear,phase:e.seasonPhase,sequence:e.sequence,
    matchRef:e.matchId||null,scheduleRef:e.scheduleEntryId||null,parentRef:e.parentEvidenceId||null,
    durable:e.evidenceType==='coachSchoolConnection',
    recordedYearDistance:position.careerYear-e.careerYear,
    samePhase:position.careerYear===e.careerYear&&position.seasonPhase===e.seasonPhase,
    sameWindow:position.careerYear===e.careerYear&&position.seasonPhase===e.seasonPhase&&position.sequence===e.sequence,
    // Sequence is scoped to a phase, not a universal clock. Never compare phase strings.
    sequenceDistance:position.careerYear===e.careerYear&&position.seasonPhase===e.seasonPhase?position.sequence-e.sequence:null,
    ageMeaning:e.evidenceType==='coachSchoolConnection'?'recorded contact, not relationship inception':'source match semantic position'}));
}
function inspectRefs(state,refs,position) {
  const rows=inspectLedger(state,position),ids=[...new Set(refs)];
  const found=ids.map(id=>rows.find(e=>e.evidenceId===id));
  if(found.some(e=>!e))throw Error('Unresolved canonical evidence reference');
  const years=found.map(e=>e.year);
  return {evidenceCount:found.length,oldestYear:years.length?Math.min(...years):null,mostRecentYear:years.length?Math.max(...years):null,
    exactLatestAcrossPhasesAvailable:false,records:found};
}
function sourceSearch() {
  const terms=/relationship|reputation|prestige|recency|recent|history|schoolStandard|teamStrength|coach|interest|visibility|recognition|status/i;
  return fs.readdirSync(root).filter(f=>f.endsWith('.js')).sort().map(file=>{
    const text=fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n?/g,'\n');
    return {file,sha256:crypto.createHash('sha256').update(text).digest('hex'),hits:text.split('\n').flatMap((line,i)=>terms.test(line)?[{line:i+1,text:line.trim().slice(0,400)}]:[])};
  });
}
const classifications={
  recency:'PARTIAL',reputation:'PARTIAL',
  recencyReason:'Year distance and same-phase position are reconstructible. Arbitrary phase strings have no general ordinal contract; coach observation time is not relationship inception.',
  reputationReason:'Player reputation is a persisted production-used scalar; no school/program/coach public reputation authority or complete world history exists. Player scalar cannot authorize school opportunity weighting.',
  safeInfluenceLayer:'Explainability only; any future optional probability factor requires a separately versioned contract.',
  saveImpact:'No new state for reconstructible year/phase observations. No persistent currentRecencyScore.',
  warnings:['No universal cross-phase ordering or real-date clock','Coach contact record time does not establish relationship age/expiry','School/program/coach reputation authority unavailable; player scalar is domain-limited']
};
module.exports={inspectLedger,inspectRefs,sourceSearch,signature,classifications,TYPES:Network.TYPES};
