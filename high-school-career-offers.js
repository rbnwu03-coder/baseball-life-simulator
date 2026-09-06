(function(root,factory) {
  const api=factory(root.HighSchoolCareerEvaluation || (typeof require==="function"?require("./high-school-career-evaluation.js"):null));
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  root.HighSchoolCareerOffers=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Evidence){
  "use strict";
  const VERSION="high-school-career-offers-v1";
  const EXITS={draft:"高卒選秀・中後段指名候選",tryout:"高卒選秀・落選／培訓測試",college:"大學棒球",amateur:"業餘／社會人棒球",rehab:"復健與生涯暫停"};
  const REASONS={strongCapability:"能力具備發展空間",strongFormalPerformance:"正式比賽留下正向證明",limitedExposure:"正式出場樣本有限",strongDevelopmentTrajectory:"持續累積訓練成長",highCompetitionContext:"守位競爭密集",healthConcern:"健康需要負荷管理",insufficientFormalEvidence:"正式比賽證據仍不足",pitchingEvidenceUnavailable:"尚無正式投球實績",academicFit:"課業條件符合升學入口",academicConcern:"課業條件尚待補足",developmentFit:"適合繼續培養",immediateRoleFit:"已有可使用的守位能力",careerPause:"可選擇休養並保留重返棒球的時間",draftIntentRequired:"尚未表達參與選秀意願",insufficientCapability:"目前能力尚未達此入口要求",projectionBased:"以發展潛力評估",formalProof:"以正式比賽證據評估",draftTryout:"目前僅有測試與低順位觀察興趣"};
  const clone=v=>JSON.parse(JSON.stringify(v));
  function resolveHighSchoolCareerEligibility(e) {
    if(!Evidence.isValidSnapshot(e)) return {ok:false,routes:[]};
    const talent=e.talent.capability,health=e.healthRisk,proof=e.performanceProof;
    const severe=health.injuryRisk>=8||health.pain>=5;
    const reasons=[];
    if(talent>=7)reasons.push("strongCapability");
    if(proof.careerQuality>0)reasons.push("strongFormalPerformance");
    if(proof.confidence<0.5)reasons.push("limitedExposure");
    if(e.developmentTrajectory.growth>=1)reasons.push("strongDevelopmentTrajectory");
    if(severe)reasons.push("healthConcern");
    if(["high","veryHigh"].includes(e.schoolContext.competition.competitionDensity))reasons.push("highCompetitionContext");
    const draftReasons=[];
    if(e.intent!=="draft")draftReasons.push("draftIntentRequired");
    if(e.positionProfile.pitchingEvidenceUnavailable)draftReasons.push("pitchingEvidenceUnavailable");
    if(proof.sampleCount<2||proof.confidence<0.3)draftReasons.push("insufficientFormalEvidence");
    if(talent<6||e.talent.positionSkill<4)draftReasons.push("insufficientCapability");
    if(severe)draftReasons.push("healthConcern");
    const collegeReasons=[];
    if(e.academics<4)collegeReasons.push("academicConcern");
    if(talent<3)collegeReasons.push("insufficientCapability");
    const amateurReasons=[];
    if(talent<3||e.talent.positionSkill<2)amateurReasons.push("insufficientCapability");
    if(health.injuryRisk>=12||health.pain>=8)amateurReasons.push("healthConcern");
    return {ok:true,evidenceIdentity:e.evidenceIdentity,routes:[
      {route:"draft",eligible:!draftReasons.length,reasonCodes:draftReasons.length?draftReasons:[...reasons,"formalProof"]},
      {route:"college",eligible:!collegeReasons.length,reasonCodes:collegeReasons.length?collegeReasons:[...reasons,"academicFit","developmentFit",...(e.positionProfile.pitcher?["pitchingEvidenceUnavailable","projectionBased"]:[])]},
      {route:"amateur",eligible:!amateurReasons.length,reasonCodes:amateurReasons.length?amateurReasons:[...reasons,e.positionProfile.pitcher?"developmentFit":"immediateRoleFit",...(e.positionProfile.pitcher?["pitchingEvidenceUnavailable","projectionBased"]:[])]},
      {route:"rehab",eligible:true,reasonCodes:["careerPause",...(severe?["healthConcern"]:[])]}
    ]};
  }
  function generate(e) {
    const eligibility=resolveHighSchoolCareerEligibility(e);
    if(!eligibility.ok)return null;
    const offerSetIdentity=`${VERSION}|${Evidence.identity({evidence:e.evidenceIdentity,completion:e.completionIdentity})}`;
    const offers=eligibility.routes.filter(item=>item.eligible).map(item=>{
      const strong=item.route==="draft"&&e.talent.capability>=8&&e.performanceProof.confidence>=0.6&&e.performanceProof.careerQuality>0&&e.performanceProof.recentQuality>=0&&e.competitionProof.accumulatedScore>=0&&e.visibility.scoutAwareness>=3;
      const type=item.route==="draft"?(strong?"draft-interest":"draft-tryout"):item.route==="college"?"college-development":item.route==="amateur"?(e.positionProfile.pitcher?"amateur-development":"amateur-opportunity"):"rehab-pause";
      return {offerId:`${offerSetIdentity}|${item.route}`,route:item.route,offerType:type,eligibilityStatus:"eligible",confidence:item.route==="draft"?(strong?"moderate":"low"):"development",tier:item.route==="draft"?(strong?"middle-late":"tryout"):"development",reasonCodes:[...item.reasonCodes,...(item.route==="draft"&&!strong?["draftTryout"]:[])],evidenceSnapshotId:e.evidenceIdentity,careerExit:item.route==="draft"?(strong?EXITS.draft:EXITS.tryout):EXITS[item.route]};
    });
    return {offerSetIdentity,generationVersion:VERSION,generatedFromEvidenceIdentity:e.evidenceIdentity,eligibility,offers};
  }
  function commitHighSchoolCareerChoice(player,offerId) {
    const state=player.highSchoolCareerSettlement;
    if(!state||!state.evidence||!state.offerSet)return {ok:false,reason:"missingOfferSet"};
    if(state.appliedSettlementIdentity)return {ok:state.selectedOffer?.offerId===offerId,status:"already-applied"};
    if(player.chapter!=="青棒關鍵年"||player.criticalYearStep!==7||player.forcedEventId)return {ok:false,reason:"invalidSelectionWindow"};
    const expected=generate(state.evidence);
    if(!expected || state.settlementIdentity!==`${expected.offerSetIdentity}|settlement`
      || JSON.stringify(expected)!==JSON.stringify(state.offerSet))return {ok:false,reason:"invalidOfferSet"};
    const offer=expected.offers.find(item=>item.offerId===offerId);
    if(!offer)return {ok:false,reason:"illegalOffer"};
    state.selectedOffer=clone(offer);
    state.careerExit=offer.careerExit;
    state.appliedSettlementIdentity=state.settlementIdentity;
    player.careerExit=offer.careerExit;
    return {ok:true,status:"applied",offer:clone(offer)};
  }
  return Object.freeze({VERSION,EXITS,REASONS,resolveHighSchoolCareerEligibility,generate,commitHighSchoolCareerChoice});
});
