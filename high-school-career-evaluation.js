(function(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HighSchoolCareerEvaluation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const VERSION = "high-school-career-evidence-v1";
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const mean = values => values.length ? values.reduce((a,b) => a+b,0)/values.length : 0;
  function freeze(value) {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key,stable(value[key])]));
    return value;
  }
  function identity(value) {
    const text=JSON.stringify(stable(value)); let hash=2166136261;
    for (let i=0;i<text.length;i++) hash=Math.imul(hash ^ text.charCodeAt(i),16777619);
    return (hash>>>0).toString(16).padStart(8,"0");
  }
  function getHighSchoolCareerMatchEvidence(player) {
    const records = [player.highSchoolYearOneMatchHistory,player.highSchoolYearTwoMatchHistory,player.highSchoolYearThreeMatchHistory];
    const seen=new Set(); const matches=[];
    records.forEach((history,index) => (history || []).forEach(record => {
      const id=record.matchId || record.matchIdentity;
      if (!id || seen.has(id)) return;
      seen.add(id);
      const exposure=record.actualExposure || {};
      const pa=Math.max(0,number(exposure.plateAppearances));
      const innings=Math.max(0,number(exposure.defensiveInnings));
      const source=record.competitionEvidence || (player.highSchoolCompetitionEvaluation?.evidenceHistory || []).find(item=>item.matchIdentity===id);
      const contribution=record.playerContribution || {};
      const attempts=number(contribution.strong)+number(contribution.mixed)+number(contribution.failure);
      const quality=pa+innings>0 ? (source?.matchEvidence ? number(source.matchEvidence.quality) : attempts ? (number(contribution.strong)-number(contribution.failure))/attempts*2 : 0) : 0;
      matches.push({...clone(record),matchIdentity:id,year:index+1,quality,plateAppearances:pa,defensiveInnings:innings,participated:pa+innings>0});
    }));
    const played=matches.filter(item=>item.participated);
    const pa=played.reduce((sum,item)=>sum+item.plateAppearances,0);
    const innings=played.reduce((sum,item)=>sum+item.defensiveInnings,0);
    return freeze({matches,years:[1,2,3].map(year=>({year,matches:matches.filter(item=>item.year===year)})),
      totalActualExposure:{plateAppearances:pa,defensiveInnings:innings},sampleCount:played.length,
      careerQuality:mean(played.map(item=>item.quality)),recentQuality:mean(played.slice(-2).map(item=>item.quality)),
      confidence:Math.min(1,played.length/3)*Math.min(1,(pa+innings)/12),recentEvidence:played.slice(-2)});
  }
  function getHighSchoolRoleJourney(player) {
    const histories=[player.highSchoolYearOneMatchHistory||[],player.highSchoolYearTwoMatchHistory||[],player.highSchoolYearThreeMatchHistory||[]];
    const transitions=player.highSchoolYearTransitionState?.history||[];
    const years=histories.map((matches,index)=>{
      const year=index+1;
      const entry=transitions.find(item=>item.nextHighSchoolYear===year);
      const next=transitions.find(item=>item.nextHighSchoolYear===year+1);
      const start=year===1 ? player.highSchoolYearOneStartingRole : entry?.currentRole;
      return {year,startingRole:start||matches[0]?.evaluationConsequence?.previousRole||"unknown",
        finalRole:year===3 ? player.highSchoolRoleCode : next?.priorRole||matches.at(-1)?.evaluationConsequence?.currentRole||start||"unknown",
        transitions:matches.filter(item=>item.evaluationConsequence).map(item=>({matchIdentity:item.matchId,...clone(item.evaluationConsequence)}))};
    });
    return freeze({years,currentRole:player.highSchoolRoleCode||"bench",yearTransitions:clone(transitions)});
  }
  function derive(player, context={}) {
    const formal=getHighSchoolCareerMatchEvidence(player);
    const skills=player.baseballSkills || {};
    const position=player.primaryPosition || player.seasonPosition || "";
    const pitcher=["P","投手"].includes(position);
    const catcher=["C","捕手"].includes(position);
    const positionKeys=pitcher?["control","pitchStamina","throwing"]:catcher?["catching","blocking","gameCalling","throwing"]:["catching","throwing","reaction","range"];
    const positionSkill=mean(positionKeys.map(key=>number(skills[key])));
    const talent=mean([number(skills.batting),positionSkill,number(skills.baseballIQ)]);
    const development=player.developmentState || {};
    const initial=player.capabilityState?.initialBaseballSkills || {};
    const growth=mean(Object.keys(initial).map(key=>Math.max(0,number(skills[key])-number(initial[key]))));
    const competition=player.highSchoolCompetitionEvaluation || {};
    const school=player.schoolInvitationState || {};
    const evidence={version:VERSION,completionIdentity:context.completionIdentity||`${school.selectedSchoolYearRosterIdentity?.identity||player.name}|high-school-completion`,
      talent:{capability:talent,positionSkill,batting:number(skills.batting),positionFit:number(context.positionFit)},
      positionProfile:{primaryPosition:position,secondaryPositions:clone(player.secondaryPositions||[]),pitcher,catcher,formalPitchingEvidence:0,pitchingEvidenceUnavailable:pitcher},
      roleJourney:getHighSchoolRoleJourney(player),formalMatches:formal,
      performanceProof:{sampleCount:formal.sampleCount,careerQuality:formal.careerQuality,recentQuality:formal.recentQuality,confidence:formal.confidence},
      exposureProof:formal.totalActualExposure,
      competitionProof:{sampleCount:number(competition.sampleCount),accumulatedScore:number(competition.accumulatedScore),recentTrend:competition.recentTrend||"neutral",promotionPressure:number(competition.promotionPressure),demotionPressure:number(competition.demotionPressure)},
      developmentTrajectory:{growth,history:clone(development.history||[]),progress:clone(development.skillProgress||{})},
      healthRisk:{fatigue:number(player.body?.fatigue),pain:number(player.body?.pain),injuryRisk:number(player.body?.injuryRisk),burnout:number(player.burnout)},
      visibility:{scoutAwareness:number(player.scoutEvaluation),exposure:number(player.exposure),reputation:number(player.reputation),source:"mixed-external-perception-not-performance"},
      publicImpression:{source:"context-only-not-match-proof",signals:(player.flags||[]).filter(flag=>/^(scout_pitch_|family_declared_)/.test(flag)||["stayed_grounded_after_media","used_media_momentum","managed_media_health_story"].includes(flag))},
      academics:number(player.academics),intent:context.intent||"open",
      schoolContext:{schoolId:school.selectedSchoolId||"",rosterIdentity:school.selectedSchoolYearRosterIdentity?.identity||"",competition:clone(school.selectedPositionCompetitionContext||{}),teamStrength:clone(school.selectedTeamStrengthProfile||{})},
      opportunityHistory:clone(player.highSchoolOpportunityHistory||[])};
    evidence.evidenceIdentity=`${VERSION}|${identity(evidence)}`;
    return freeze(evidence);
  }
  function isValidSnapshot(evidence) {
    if (!evidence || evidence.version !== VERSION || !evidence.completionIdentity) return false;
    const {evidenceIdentity, ...content} = evidence;
    return evidenceIdentity === `${VERSION}|${identity(content)}`;
  }
  return Object.freeze({VERSION,identity,isValidSnapshot,getHighSchoolCareerMatchEvidence,getHighSchoolRoleJourney,derive});
});
