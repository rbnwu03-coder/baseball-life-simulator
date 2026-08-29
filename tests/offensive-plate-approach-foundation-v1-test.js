const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const OffensivePlateApproach = require("../offensive-plate-approach.js");
const PlayingTimeGameExposure = require("../playing-time-game-exposure.js");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js",
  "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const storage = new Map();
  const nodes = new Map();
  const context = vm.createContext({
    console, module: { exports: {} }, PlayingTimeGameExposure,
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {
          id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
          focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
        });
        return nodes.get(id);
      },
      querySelector() { return null; }, querySelectorAll() { return []; }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout() { return 1; }, clearTimeout() {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __opaMatch({runners=[null,null,null],outs=0,scores={home:1,away:1},momentIndex=0,seed=91001}={}) {
      stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
      player=createInitialPlayer("進攻打席測試球員");
      applyDebugBookmarkCharacterProfile(player); settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
      Object.assign(player,{observe:9,ballSense:9});
      Object.assign(player.baseballSkills,{batting:9,baseballIQ:9});
      player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
      pendingHighSchoolMatchSimulationSeed=seed;
      const match=prepareHighSchoolYearOneMatch();
      Object.assign(match,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs,
        runners:runners.slice(),scores:{...scores},momentIndex,currentMomentId:highSchoolYearOneMomentIds[momentIndex],
        currentDomain:"offense",simulationPhase:"moment_"+(momentIndex+1)+"_ready",completed:false,settled:false,
        completedMoments:[],decision:"",outcome:"",consequence:"",offensivePlateAppearanceState:null});
      syncHighSchoolMatchPlayerRunnerLocation(match);
      return match;
    }
    function __pitch(type) { return {pitchLocationClass:type}; }
    function __resolveOPA(match,decision,pitchSequence,pitchOptions) {
      const choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision===decision);
      return resolveHighSchoolOffensiveDecision(match,choice,null,{plateAppearance:{pitchSequence,pitchOptions}});
    }
    function __opportunityChoices() {
      return [
        {selectionProfile:"aggressive",swingIntent:"power",objective:"createExtraBaseHit"},
        {selectionProfile:"selective",swingIntent:"normal",objective:"reachBase"},
        {selectionProfile:"balanced",swingIntent:"contact",objective:"putBallInPlay"}
      ];
    }
    function __opportunityMatch({inning=7,half="下",outs=0,runners=[null,null,null],scores={home:1,away:2},priorPA=0}={}) {
      return {id:"opportunity-fixture",inning,half,outs,runners:runners.slice(),scores:{...scores},regulationInnings:7,
        completed:false,pendingGameSettlement:"",simulationLog:Array.from({length:priorPA},(_,index)=>({type:"plateAppearance",batterId:"player",sequence:index})),
        matchDecisionDensityState:createHighSchoolMatchDecisionDensityState(),offenseTeam:"home",defenseTeam:"away",
        playerEntryCompleted:true,playerLineupStatus:"starter",battingOrderIndex:{home:0,away:0},
        rosters:{home:{lineup:[{id:"player",position:"內野手"}]},away:{lineup:[{id:"away-p",position:"投手"}]}}};
    }
    function __agencyMatch({inning=7,outs=2,runners=[null,null,null],scores={home:1,away:9},phase="moment_3_resolved"}={}) {
      const match=__opaMatch({momentIndex:2,outs,runners,scores});
      Object.assign(match,{inning,half:"下",offenseTeam:"home",defenseTeam:"away",simulationPhase:phase,currentDomain:"flow",pendingGameSettlement:"",completed:false,playerEntryCompleted:true,playerLineupStatus:"starter"});
      const slot=match.rosters.home.lineup.findIndex(item=>item.id==="player");
      match.battingOrderIndex.home=slot;
      match.currentBatter="player";
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(inning,"下");
      match.presentedEventCursor=match.simulationLog.length;
      return match;
    }
    function __reachAgency(match) {
      const result=advanceHighSchoolMatchPlaybackStep(match);
      return {result,match,state:match.offensivePlayerAgencyState,choices:getHighSchoolYearOneMatchMomentChoices(match)};
    }
    function __runOpportunityAudit(gameCount=2000) {
      const buckets={zero:0,one:0,two:0,three:0,fourPlus:0};
      const totals={lateMeaningfulCandidates:0,lateAdmitted:0,lateSuppressed:0,criticalCandidates:0,criticalAdmitted:0,routineSuppressed:0,repeatSuppressed:0,illegalAdmission:0,duplicatePA:0,cursorDrift:0,freeze:0,rngDrift:0,nan:0};
      for(let gameIndex=0;gameIndex<gameCount;gameIndex+=1){
        const match=__opportunityMatch(); let decisions=0; const seen=new Set(); const paCount=1+(gameIndex%5);
        for(let pa=1;pa<=paCount;pa+=1){
          match.inning=Math.min(7,2+pa+(gameIndex%3)); match.half="下"; match.outs=(gameIndex+pa)%3;
          const mode=(gameIndex+pa)%7;
          match.scores=mode===0?{home:1,away:9}:mode===1?{home:9,away:2}:mode<=3?{home:2,away:3}:{home:3,away:3};
          match.runners=mode===2?[null,"r2",null]:mode===4?["r1",null,null]:[null,null,null];
          match.simulationLog=Array.from({length:pa-1},(_,index)=>({type:"plateAppearance",batterId:"player",sequence:index}));
          const classification=classifyHighSchoolOffensiveOpportunity(match,__opportunityChoices());
          const repeatedClassification=classifyHighSchoolOffensiveOpportunity(match,__opportunityChoices());
          if(JSON.stringify(classification)!==JSON.stringify(repeatedClassification)) totals.rngDrift+=1;
          const density=evaluateHighSchoolOffensiveDecisionDensity(match,classification);
          if(classification.lateGame&&classification.meaningfulCandidate) totals.lateMeaningfulCandidates+=1;
          if(classification.leverageClass==="critical") totals.criticalCandidates+=1;
          if(density.allowed){
            decisions+=1; totals.lateAdmitted+=classification.lateGame?1:0; totals.criticalAdmitted+=classification.leverageClass==="critical"?1:0;
            if(!classification.meaningfulCandidate) totals.illegalAdmission+=1;
            const key=classification.playerPANumber; if(seen.has(key)) totals.duplicatePA+=1; seen.add(key);
          } else {
            totals.lateSuppressed+=classification.lateGame&&classification.meaningfulCandidate?1:0;
            totals.routineSuppressed+=density.suppressionReason==="routine-opportunity"?1:0;
            totals.repeatSuppressed+=density.suppressionReason==="repeated-routine-structure"?1:0;
          }
          applyHighSchoolOffensiveDecisionDensity(match,classification,density,density.allowed);
          if(![classification.inning,classification.outs,classification.scoreDifference,density.playerPANumber].every(Number.isFinite)) totals.nan+=1;
        }
        if(decisions===0)buckets.zero+=1;else if(decisions===1)buckets.one+=1;else if(decisions===2)buckets.two+=1;else if(decisions===3)buckets.three+=1;else buckets.fourPlus+=1;
      }
      return {gameCount,buckets,totals};
    }
    function __runAgencyAudit(gameCount=2000) {
      const totals={gamesSampled:gameCount,lateGamePlayerPA:0,lateGameAgencyOpportunities:0,lateGameRoutineAgency:0,manualPathFixtures:0,simulatePathFixtures:0,duplicatePA:0,skippedPA:0,cursorDrift:0,freeze:0,rngIntegrity:0,nan:0};
      for(let gameIndex=0;gameIndex<gameCount;gameIndex+=1){
        const inning=5+(gameIndex%4); const largeGap=gameIndex%3===0;
        const match=__opportunityMatch({inning,outs:gameIndex%3,scores:largeGap?{home:1,away:9}:{home:2,away:3},runners:gameIndex%4===0?[null,"r2",null]:[null,null,null]});
        const classification=classifyHighSchoolOffensiveOpportunity(match,__opportunityChoices());
        const first=evaluateHighSchoolOffensivePlayerAgency(match,classification);
        const second=evaluateHighSchoolOffensivePlayerAgency(match,classification);
        if(inning>=7)totals.lateGamePlayerPA+=1;
        if(first.lateGamePlayerAgency){totals.lateGameAgencyOpportunities+=1;if(classification.leverageClass==="routine")totals.lateGameRoutineAgency+=1;if(gameIndex%2===0)totals.manualPathFixtures+=1;else totals.simulatePathFixtures+=1;}
        if(JSON.stringify(first)!==JSON.stringify(second))totals.rngIntegrity+=1;
        if(![first.inning,first.regulationInnings,first.playerPANumber].every(Number.isFinite))totals.nan+=1;
      }
      return totals;
    }
    function __prepareCanonicalPlayerTurn(match) {
      let safety=0;
      Object.assign(match,{half:"下",offenseTeam:"home",defenseTeam:"away",completed:false,settled:false,pendingGameSettlement:""});
      while(getHighSchoolMatchLineupBatter(match,"home")?.id!=="player"&&safety++<12){
        match.outs=0;match.runners=[null,null,null];
        if(!resolveSimulatedHighSchoolPlateAppearance(match,()=>.72))return false;
      }
      match.outs=0;match.runners=[null,null,null];match.currentBatter="player";
      return getHighSchoolMatchLineupBatter(match,"home")?.id==="player";
    }
    function __automaticCanonicalPlayerPA(match,sample=.72) {
      if(!__prepareCanonicalPlayerTurn(match))return false;
      const before=match.battingOrderIndex.home;
      const result=resolveSimulatedHighSchoolPlateAppearance(match,()=>sample,{allowPlayer:true});
      const expected=(before+1)%match.rosters.home.lineup.length;
      return result?.batterId==="player"&&match.battingOrderIndex.home===expected;
    }
    function __manualCanonicalPlayerPA(match,pitchSequence,pitchOptions,decision="zone") {
      if(!__prepareCanonicalPlayerTurn(match))return false;
      const before=match.battingOrderIndex.home;
      const number=(match.simulationLog||[]).filter(event=>event.type==="plateAppearance"&&event.batterId==="player").length+1;
      Object.assign(match,{inning:Math.max(2,Math.min(6,number+1)),momentIndex:2,currentMomentId:"canonical_pa_audit_"+number,currentDomain:"offense",simulationPhase:"moment_3_ready",offensivePlateAppearanceState:null});
      match.pendingOffensiveOpportunity={version:"canonical-pa-audit",status:"pending",kind:"classified",momentId:match.currentMomentId,paIdentity:"",resumePhase:"full_match_flow",playerPANumber:number};
      const choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision===decision)||getHighSchoolYearOneMatchMomentChoices(match)[0];
      const resolved=choice&&resolveHighSchoolOffensiveDecision(match,choice,null,{resolvedPhase:"full_match_flow",plateAppearance:{pitchSequence,pitchOptions}});
      const expected=(before+1)%match.rosters.home.lineup.length;
      return Boolean(resolved)&&match.battingOrderIndex.home===expected;
    }
    function __agencyCanonicalPlayerPA(match,selection="simulate") {
      if(!__prepareCanonicalPlayerTurn(match))return false;
      const before=match.battingOrderIndex.home;
      Object.assign(match,{inning:7,half:"下",outs:2,runners:[null,null,null],scores:{home:1,away:9},momentIndex:2,currentMomentId:"",currentDomain:"flow",simulationPhase:"full_match_flow",pendingGameSettlement:"",completed:false,settled:false});
      match.scoreboardRevealHalfIndex=getHighSchoolHalfInningIndex(7,"下");
      match.presentedEventCursor=match.simulationLog.length;
      const rngBefore=match.simulationCursor;
      const reached=advanceHighSchoolMatchPlaybackStep(match);
      const state=match.offensivePlayerAgencyState;
      if(reached!=="decision"||match.simulationPhase!=="offensive_agency_ready"||!state||match.simulationCursor!==rngBefore)return false;
      if(!chooseHighSchoolOffensiveAgency(selection,state.momentId))return false;
      if(selection==="manual"){
        const choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision==="zone");
        if(!choice||!resolveHighSchoolOffensiveDecision(match,choice,null,{resolvedPhase:match.pendingOffensiveOpportunity.resumePhase,plateAppearance:{pitchSequence:[__pitch("hitterPitch")],pitchOptions:[{decisionRoll:0,contactRoll:0,foulRoll:1,outcomeRoll:.62}]}}))return false;
      }
      stopHighSchoolMatchPlayback("canonical-pa-audit");
      const expected=(before+1)%match.rosters.home.lineup.length;
      return match.battingOrderIndex.home===expected;
    }
    function __finalizeCanonicalPAAccounting(match) {
      const canonicalEvents=(match.simulationLog||[]).filter(event=>event.type==="plateAppearance"&&event.batterId==="player");
      const canonicalPlayerPACompleted=canonicalEvents.length;
      match.completed=true;match.settled=true;match.simulationPhase="complete";
      const exposureResult=finalizeHighSchoolGameExposure(match);
      const gameExposurePA=match.gameExposureState?.finalized?match.gameExposureState.plateAppearances:-1;
      const settlement=MatchExperienceDevelopment.settleMatchExperienceDevelopment(player,match,{exposure:{defensiveInnings:match.gameExposureState?.defensiveInnings||0,plateAppearances:gameExposurePA,role:match.role||match.playerLineupStatus||"bench"}});
      const view=MatchDevelopmentSettlementPresentation.createViewModel(match);
      return {canonicalPlayerPACompleted,gameExposurePA,settlementDisplayedPA:view.participation.plateAppearances,settled:settlement.ok&&match.matchExperience?.settled===true,
        offensiveDecisionCount:(match.completedMoments||[]).filter(moment=>moment.domain==="offense").length,
        playerAgencyParticipationCount:(match.opportunityDebugTrace?.opportunities||[]).filter(item=>item.agencyOpportunityCandidate&&item.agencySelection).length,
        evidencePA:match.performanceEvidence?.player?.plateAppearances||0,canonicalEvents};
    }
    function __canonicalAccountingFixture(types=[]) {
      const match=__opaMatch({seed:93000+types.length});
      setHighSchoolMatchOpportunityDebugEnabled(true);
      match.simulationLog=[];match.presentedEventCursor=0;match.performanceEvidence={};match.completedMoments=[];match.matchExperience=null;match.offensivePlayerAgencyState=null;
      match.gameExposureState=PlayingTimeGameExposure.createGameExposureState({matchId:match.id,plannedUsage:{appearanceType:"start",entryInning:1,entryHalf:"上"},exposureSource:"canonical-pa-audit"});
      let ok=true;
      types.forEach((type,index)=>{
        if(!ok)return;
        if(type==="automatic")ok=__automaticCanonicalPlayerPA(match,.71+(index%3)*.03);
        else if(type==="manualWalk")ok=__manualCanonicalPlayerPA(match,[__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall")],Array.from({length:4},()=>({decisionRoll:.99,recognitionRoll:0})));
        else if(type==="manualK")ok=__manualCanonicalPlayerPA(match,[__pitch("competitiveStrike"),__pitch("competitiveStrike"),__pitch("competitiveStrike")],Array.from({length:3},()=>({decisionRoll:.99,recognitionRoll:0})));
        else if(type==="manualBIP")ok=__manualCanonicalPlayerPA(match,[__pitch("hitterPitch")],[{decisionRoll:0,contactRoll:0,foulRoll:1,outcomeRoll:.62}]);
        else if(type==="multiPitch")ok=__manualCanonicalPlayerPA(match,[__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall"),__pitch("competitiveStrike"),__pitch("competitiveStrike"),__pitch("hitterPitch"),__pitch("hitterPitch"),__pitch("hitterPitch"),__pitch("hitterPitch"),__pitch("clearBall")],[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:0,contactRoll:0,foulRoll:0},{decisionRoll:0,contactRoll:0,foulRoll:0},{decisionRoll:0,contactRoll:0,foulRoll:0},{decisionRoll:0,contactRoll:0,foulRoll:0},{decisionRoll:.99}]);
        else if(type==="agencyManual")ok=__agencyCanonicalPlayerPA(match,"manual");
        else if(type==="agencySimulate")ok=__agencyCanonicalPlayerPA(match,"simulate");
      });
      const accounting=__finalizeCanonicalPAAccounting(match);
      return {ok,match,accounting};
    }
    function __midPACanonicalReloadFixture() {
      let match=__opaMatch({seed:93444});
      match.simulationLog=[];match.presentedEventCursor=0;match.performanceEvidence={};match.completedMoments=[];match.matchExperience=null;
      match.gameExposureState=PlayingTimeGameExposure.createGameExposureState({matchId:match.id,plannedUsage:{appearanceType:"start",entryInning:1,entryHalf:"上"},exposureSource:"canonical-pa-audit"});
      if(!__prepareCanonicalPlayerTurn(match))return {ok:false};
      Object.assign(match,{inning:5,momentIndex:2,currentMomentId:"canonical_pa_reload",currentDomain:"offense",simulationPhase:"moment_3_ready",offensivePlateAppearanceState:null});
      match.pendingOffensiveOpportunity={version:"canonical-pa-audit",status:"pending",kind:"classified",momentId:match.currentMomentId,paIdentity:"",resumePhase:"full_match_flow",playerPANumber:1};
      let choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision==="zone");
      let state=ensureHighSchoolOffensivePlateAppearanceState(match,choice);
      const partial=[
        [__pitch("clearBall"),{decisionRoll:.99,recognitionRoll:0}],
        [__pitch("competitiveStrike"),{decisionRoll:.99,recognitionRoll:0}],
        [__pitch("clearBall"),{decisionRoll:.99,recognitionRoll:0}],
        [__pitch("competitiveStrike"),{decisionRoll:.99,recognitionRoll:0}]
      ];
      partial.forEach(([pitch,options])=>{state=OffensivePlateApproach.resolveNextPitch(state,getHighSchoolOffensivePlateApproachAbilities(player),{pitch,...options}).state;});
      match.offensivePlateAppearanceState=JSON.parse(JSON.stringify(state));player.highSchoolMatch=match;
      player=normalizeSave(JSON.parse(JSON.stringify(player)));match=player.highSchoolMatch;
      choice=getHighSchoolYearOneMatchMomentChoices(match).find(item=>item.matchDecision==="zone");
      const before=match.battingOrderIndex.home;
      const resolved=resolveHighSchoolOffensiveDecision(match,choice,null,{resolvedPhase:"full_match_flow",plateAppearance:{pitchSequence:[__pitch("hitterPitch")],pitchOptions:[{decisionRoll:0,contactRoll:0,foulRoll:1,outcomeRoll:.62}]}});
      const accounting=__finalizeCanonicalPAAccounting(match);
      return {ok:Boolean(resolved)&&state.balls===2&&state.strikes===2&&match.battingOrderIndex.home===(before+1)%match.rosters.home.lineup.length,accounting,pitchCount:match.offensivePlateAppearanceState.pitchNumber};
    }
    function __substituteCanonicalFixture() {
      const match=__opaMatch({seed:93555});
      match.simulationLog=[];match.presentedEventCursor=0;match.performanceEvidence={};match.completedMoments=[];match.matchExperience=null;
      match.gameExposureState=PlayingTimeGameExposure.createGameExposureState({matchId:match.id,plannedUsage:{appearanceType:"lateGameAppearance",entryInning:5,entryHalf:"上"},exposureSource:"canonical-pa-audit"});
      match.playerLineupStatus="substitute";match.playerEntryCompleted=true;
      recordHighSchoolMatchSimulationEvent(match,{type:"playerEntry",inning:5,half:"上",sequence:0,playerId:"player",lineupSlot:match.playerLineupSlot});
      const ok=__automaticCanonicalPlayerPA(match,.76)&&__automaticCanonicalPlayerPA(match,.78);
      return {ok,accounting:__finalizeCanonicalPAAccounting(match)};
    }
    function __runCanonicalPAAccountingAudit(gameCount=2000) {
      const report={gamesSampled:gameCount,distribution:{0:0,1:0,2:0,3:0,4:0,"5+":0},gameExposureMismatch:0,settlementDisplayMismatch:0,manualPA:0,automaticPA:0,lateGameAgencyManualPA:0,lateGameAgencySimulatedPA:0,multiPitchPA:0,walkPA:0,strikeoutPA:0,bipPA:0,duplicatePA:0,skippedPA:0,duplicateBattingOrderAdvancement:0,cursorDrift:0,nan:0,freeze:0,rngIntegrityError:0};
      for(let gameIndex=0;gameIndex<gameCount;gameIndex+=1){
        const target=gameIndex%7;const types=[];
        for(let pa=0;pa<target;pa+=1){const mode=(gameIndex+pa)%6;types.push(mode===0?"automatic":mode===1?"manualWalk":mode===2?"manualK":mode===3?"manualBIP":mode===4?"agencyManual":"agencySimulate");}
        const fixture=__canonicalAccountingFixture(types);const a=fixture.accounting;
        if(!fixture.ok)report.freeze+=1;
        const bucket=a.canonicalPlayerPACompleted>=5?"5+":String(a.canonicalPlayerPACompleted);report.distribution[bucket]+=1;
        if(a.canonicalPlayerPACompleted!==a.gameExposurePA)report.gameExposureMismatch+=1;
        if(a.canonicalPlayerPACompleted!==a.settlementDisplayedPA)report.settlementDisplayMismatch+=1;
        if(a.canonicalPlayerPACompleted!==target)report.skippedPA+=1;
        if(a.evidencePA!==a.canonicalPlayerPACompleted)report.duplicatePA+=1;
        const playerEvents=a.canonicalEvents;
        report.manualPA+=playerEvents.filter(event=>event.meaningful===true).length;
        report.automaticPA+=playerEvents.filter(event=>event.meaningful!==true).length;
        report.multiPitchPA+=playerEvents.filter(event=>(Number(event.pitchCount)||0)>1).length;
        report.walkPA+=playerEvents.filter(event=>event.result==="walk").length;
        report.strikeoutPA+=playerEvents.filter(event=>event.result==="strikeout").length;
        report.bipPA+=playerEvents.filter(event=>["out","productiveOut","single","double","triple","homeRun"].includes(event.result)).length;
        report.lateGameAgencyManualPA+=(fixture.match.opportunityDebugTrace?.opportunities||[]).filter(item=>item.agencySelection==="manual"&&item.agencyResolved).length;
        report.lateGameAgencySimulatedPA+=(fixture.match.opportunityDebugTrace?.opportunities||[]).filter(item=>item.agencySelection==="simulate"&&item.agencyResolved).length;
        if(fixture.match.presentedEventCursor>fixture.match.simulationLog.length)report.cursorDrift+=1;
        if(![a.canonicalPlayerPACompleted,a.gameExposurePA,a.settlementDisplayedPA].every(Number.isFinite))report.nan+=1;
      }
      return report;
    }
    function __presentationMeaning(result) {
      const safe=["single","double","triple","homeRun","walk"].includes(result);
      const out=["strikeout","out","productiveOut"].includes(result);
      return {runnersScored:result==="homeRun"?[{from:"batter",to:"home",runnerId:"player"}]:[],runnersAdvanced:[],runnersHeld:[],batterSafe:safe&&result!=="homeRun",batterOut:out,halfInningEnded:false,basesEmptyAfter:!safe};
    }
    function __presentationState(result,variant="selective") {
      const approach=variant==="aggressive"?"aggressiveEarlySwing":variant==="contact"?"compactContact":variant==="lineDrive"?"compactLineDrive":variant==="balanced"?"balancedAttack":"patientSelection";
      let pitchHistory=[];
      let recognitionSummary={correct:1,misread:0,chaseRecognized:0,hitterPitchRecognized:1};
      let swingExecutionSummary={swings:1,takes:0,whiffs:0,fouls:0,ballsInPlay:1,hardContacts:1};
      let decisionQuality="strong";let executionQuality="strong";
      if(result==="walk"){
        pitchHistory=Array.from({length:4},(_,index)=>({pitchNumber:index+1,pitch:{pitchLocationClass:"clearBall",strike:false},recognition:{correct:true},action:"take",pitchResult:"ball",contact:null,countBefore:{balls:index,strikes:0},countAfter:{balls:index+1,strikes:0},protectAdjusted:false}));
        recognitionSummary={correct:4,misread:0,chaseRecognized:0,hitterPitchRecognized:0};swingExecutionSummary={swings:0,takes:4,whiffs:0,fouls:0,ballsInPlay:0,hardContacts:0};executionQuality="weak";
      }else if(result==="strikeout"){
        const swinging=variant==="swinging";
        pitchHistory=[{pitchNumber:3,pitch:{pitchLocationClass:"edgeStrike",strike:true},recognition:{correct:true},action:swinging?"swing":"take",pitchResult:swinging?"swingingStrike":"calledStrike",contact:swinging?false:null,countBefore:{balls:0,strikes:2},countAfter:{balls:0,strikes:3},protectAdjusted:true}];
        recognitionSummary={correct:1,misread:0,chaseRecognized:0,hitterPitchRecognized:0};swingExecutionSummary={swings:swinging?1:0,takes:swinging?0:1,whiffs:swinging?1:0,fouls:0,ballsInPlay:0,hardContacts:0};decisionQuality=swinging?"acceptable":"questionable";executionQuality="weak";
      }else{
        const chase=variant==="chase";const contact=["contact","lineDrive"].includes(variant);
        pitchHistory=contact
          ? [{pitchNumber:3,pitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true},action:"swing",pitchResult:"foul",contact:true,countBefore:{balls:0,strikes:2},countAfter:{balls:0,strikes:2},protectAdjusted:true},{pitchNumber:4,pitch:{pitchLocationClass:"hitterPitch",strike:true},recognition:{correct:true},action:"swing",pitchResult:"ballInPlay",contact:true,countBefore:{balls:0,strikes:2},countAfter:{balls:0,strikes:2},protectAdjusted:true}]
          : [{pitchNumber:1,pitch:{pitchLocationClass:chase?"chasePitch":"hitterPitch",strike:!chase},recognition:{correct:!chase},action:"swing",pitchResult:"ballInPlay",contact:true,countBefore:{balls:0,strikes:0},countAfter:{balls:0,strikes:0},protectAdjusted:false}];
        if(contact)swingExecutionSummary={swings:2,takes:0,whiffs:0,fouls:1,ballsInPlay:1,hardContacts:0};
        if(chase){recognitionSummary={correct:0,misread:1,chaseRecognized:0,hitterPitchRecognized:0};decisionQuality="poor";executionQuality="normal";}
        if(["out","productiveOut"].includes(result)){executionQuality="normal";swingExecutionSummary.hardContacts=0;}
      }
      return OffensivePlateApproach.createPlateAppearanceState({matchId:"presentation-audit",paId:result+"-"+variant,batterId:"player",approach,pitchHistory,pitchNumber:pitchHistory.length,completed:true,result,recognitionSummary,swingExecutionSummary,decisionQuality,executionQuality});
    }
    function __presentationChoice(variant="selective") {
      const approach=variant==="aggressive"?"aggressiveEarlySwing":variant==="contact"?"compactContact":variant==="lineDrive"?"compactLineDrive":variant==="balanced"?"balancedAttack":"patientSelection";
      const packageInfo=OffensivePlateApproach.normalizeApproachPackage(approach);
      return {approach,selectionProfile:packageInfo.selectionProfile,swingIntent:packageInfo.swingIntent};
    }
    function __runOffensivePresentationAudit(sampleCount=3000) {
      const report={samples:sampleCount,singlePresentationMismatch:0,doublePresentationMismatch:0,triplePresentationMismatch:0,homeRunPresentationMismatch:0,walkPresentationMismatch:0,strikeoutSemanticMismatch:0,feedbackAttributionMismatch:0,noSwingFeedbackViolation:0,noContactFeedbackViolation:0,rngDrift:0,nan:0};
      const cases=[{result:"single",token:"一壘安打",variant:"selective"},{result:"double",token:"二壘安打",variant:"aggressive"},{result:"triple",token:"三壘安打",variant:"selective"},{result:"homeRun",token:"全壘打",variant:"aggressive"},{result:"walk",token:"四壞保送",variant:"selective"},{result:"strikeout",token:"三振",variant:"called"},{result:"strikeout",token:"三振",variant:"swinging"},{result:"out",token:"出局",variant:"selective"},{result:"single",token:"一壘安打",variant:"chase"},{result:"single",token:"一壘安打",variant:"contact"}];
      const match=__opaMatch({seed:94600});const rngBefore=match.simulationCursor;
      for(let index=0;index<sampleCount;index+=1){
        const fixture=cases[index%cases.length];const state=__presentationState(fixture.result,fixture.variant);const choice=__presentationChoice(fixture.variant);const before=JSON.stringify(state);
        const outcome=formatHighSchoolOffensivePlayerFacingResult(choice,fixture.result,__presentationMeaning(fixture.result),state).outcome;
        const execution=formatHighSchoolOffensiveExecutionText(choice,state);const feedback=formatHighSchoolOffensiveCoachFeedback(choice,state);
        if(!outcome.includes(fixture.token)){const key={single:"singlePresentationMismatch",double:"doublePresentationMismatch",triple:"triplePresentationMismatch",homeRun:"homeRunPresentationMismatch",walk:"walkPresentationMismatch"}[fixture.result];if(key)report[key]+=1;else if(fixture.result==="strikeout")report.strikeoutSemanticMismatch+=1;}
        if(fixture.result==="strikeout"&&((fixture.variant==="called"&&(!outcome.includes("主審判定第三好球")||outcome.includes("揮擊落空")))||(fixture.variant==="swinging"&&(!outcome.includes("揮擊落空")||outcome.includes("主審判定")))))report.strikeoutSemanticMismatch+=1;
        if(fixture.result==="walk"&&(!feedback.includes("攻擊區")||!feedback.includes("沒有被壞球")||feedback.includes("慢")))report.feedbackAttributionMismatch+=1;
        if(fixture.variant==="called"&&(!feedback.includes("保護範圍")||feedback.includes("動作慢")))report.feedbackAttributionMismatch+=1;
        if(fixture.variant==="swinging"&&(!feedback.includes("判斷方向合理")||!feedback.includes("沒有跟上")))report.feedbackAttributionMismatch+=1;
        if(fixture.result==="out"&&(!feedback.includes("攻擊選擇合理")||feedback.includes("判斷錯誤")))report.feedbackAttributionMismatch+=1;
        if(fixture.variant==="chase"&&(!feedback.includes("不是理想的攻擊選擇")||!feedback.includes("結果雖然上壘")))report.feedbackAttributionMismatch+=1;
        if(fixture.variant==="contact"&&(!feedback.includes("縮短揮棒")||!feedback.includes("延長了打席")))report.feedbackAttributionMismatch+=1;
        if((Number(state.swingExecutionSummary.swings)||0)===0&&/(出棒慢|揮棒太晚|沒有跟上|擊球點|打得太薄)/.test(feedback))report.noSwingFeedbackViolation+=1;
        const contacts=(Number(state.swingExecutionSummary.fouls)||0)+(Number(state.swingExecutionSummary.ballsInPlay)||0);
        if(contacts===0&&/(擊球點偏|打得太薄|接觸品質|contact quality)/i.test(feedback))report.noContactFeedbackViolation+=1;
        const repeat=formatHighSchoolOffensivePlayerFacingResult(choice,fixture.result,__presentationMeaning(fixture.result),state).outcome+"|"+formatHighSchoolOffensiveExecutionText(choice,state)+"|"+formatHighSchoolOffensiveCoachFeedback(choice,state);
        if(repeat!==outcome+"|"+execution+"|"+feedback||JSON.stringify(state)!==before||match.simulationCursor!==rngBefore)report.rngDrift+=1;
        if((outcome+execution+feedback).includes("NaN")||!Object.values(report).every(Number.isFinite))report.nan+=1;
      }
      return report;
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = source => vm.runInContext(source, context);
let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const abilities = Object.freeze({ observe: 9, baseballIQ: 9, ballSense: 9, batting: 9 });
const state = (approach, extra = {}) => OffensivePlateApproach.createPlateAppearanceState({ matchId: "fixture", paId: `${approach}-${extra.id || "x"}`, batterId: "player", approach, ...extra });
const pitch = pitchLocationClass => ({ pitchLocationClass });

const selectiveHitter = OffensivePlateApproach.resolveNextPitch(state("patientSelection", { id: "hitter" }), abilities, { pitch: pitch("hitterPitch"), decisionRoll: 0.1 });
verify("1. selective 在 0-0 hitterPitch 仍會主動出棒", selectiveHitter.event.action === "swing" && selectiveHitter.event.swingTendency >= 0.8);

const selectiveEdge = OffensivePlateApproach.resolveNextPitch(state("patientSelection", { id: "edge" }), abilities, { pitch: pitch("edgeStrike"), decisionRoll: 0.7 });
verify("2. selective 在 0-0 可放掉 edgeStrike 並承擔 called strike", selectiveEdge.event.action === "take" && selectiveEdge.event.pitchResult === "calledStrike" && selectiveEdge.state.strikes === 1);

const selectiveHit = OffensivePlateApproach.simulatePlateAppearance({
  state: state("patientSelection", { id: "hit" }), abilities,
  pitchSequence: [pitch("edgeStrike"), pitch("hitterPitch")],
  pitchOptions: [{ decisionRoll: 0.9 }, { decisionRoll: 0, contactRoll: 0, foulRoll: 1, outcomeRoll: 0.65 }]
});
verify("3. selective 可以等待甜蜜球後形成安打", ["single", "double", "triple", "homeRun"].includes(selectiveHit.result) && selectiveHit.pitchHistory[0].action === "take" && selectiveHit.pitchHistory[1].action === "swing");

const fourBalls = [pitch("clearBall"), pitch("clearBall"), pitch("chasePitch"), pitch("clearBall")];
const takeOptions = fourBalls.map(() => ({ decisionRoll: 0.99, recognitionRoll: 0 }));
const selectiveWalk = OffensivePlateApproach.simulatePlateAppearance({ state: state("patientSelection", { id: "walk" }), abilities, pitchSequence: fourBalls, pitchOptions: takeOptions });
verify("4. selective 能經四次壞球累積形成保送", selectiveWalk.result === "walk" && selectiveWalk.balls === 4 && selectiveWalk.pitchNumber === 4);

let beforeFourth = state("patientSelection", { id: "not-yet-walk" });
for (let index = 0; index < 3; index += 1) beforeFourth = OffensivePlateApproach.resolveNextPitch(beforeFourth, abilities, { pitch: pitch("clearBall"), decisionRoll: 0.99 }).state;
verify("5. 三個 ball 尚不能直接產生 walk", beforeFourth.balls === 3 && !beforeFourth.completed && beforeFourth.result === "");

let calledK = state("patientSelection", { id: "called-k" });
for (let index = 0; index < 3; index += 1) calledK = OffensivePlateApproach.resolveNextPitch(calledK, abilities, { pitch: pitch("competitiveStrike"), decisionRoll: 0.99 }).state;
verify("6. strikeout 僅由第三個 strike 結束 PA", calledK.result === "strikeout" && calledK.strikes === 3 && calledK.pitchNumber === 3);

const zeroStrikeTendency = OffensivePlateApproach.getSwingTendency(state("patientSelection", { id: "protect-zero" }), { perceivedPitchClass: "edgeStrike" });
const twoStrikeTendency = OffensivePlateApproach.getSwingTendency(state("patientSelection", { id: "protect-two", strikes: 2 }), { perceivedPitchClass: "edgeStrike" });
verify("7. selective 兩好球後會擴大 edgeStrike 保護區", twoStrikeTendency.protectAdjusted && twoStrikeTendency.tendency > zeroStrikeTendency.tendency);

const foulAtTwo = OffensivePlateApproach.resolveNextPitch(state("compactContact", { id: "foul-two", strikes: 2 }), abilities, { pitch: pitch("competitiveStrike"), decisionRoll: 0, contactRoll: 0, foulRoll: 0 });
verify("8. 兩好球後一般界外球不形成第三好球", foulAtTwo.event.pitchResult === "foul" && foulAtTwo.state.strikes === 2 && !foulAtTwo.state.completed);

const aggressiveHitter = OffensivePlateApproach.resolveNextPitch(state("aggressiveEarlySwing", { id: "aggressive-good" }), abilities, { pitch: pitch("hitterPitch"), recognitionRoll: 0, decisionRoll: 0.5 });
verify("9. aggressive 對 hitterPitch 有高出棒傾向", aggressiveHitter.event.action === "swing" && aggressiveHitter.event.swingTendency > 0.9);

const aggressiveBall = OffensivePlateApproach.resolveNextPitch(state("aggressiveEarlySwing", { id: "aggressive-ball" }), abilities, { pitch: pitch("clearBall"), decisionRoll: 0.5, recognitionRoll: 0 });
verify("10. aggressive 並非亂揮 clearBall", aggressiveBall.event.action === "take" && aggressiveBall.event.pitchResult === "ball");

const competitivePitch = { pitchLocationClass: "competitiveStrike", attackability: 0.76 };
const normalContact = OffensivePlateApproach.getContactProbability(state("balancedAttack", { id: "normal-contact" }), competitivePitch, abilities, { correct: true });
const compactContact = OffensivePlateApproach.getContactProbability(state("compactContact", { id: "compact-contact" }), competitivePitch, abilities, { correct: true });
verify("11. compact contact 的接觸率高於 normal", compactContact > normalContact);

const mappings = ["aggressiveEarlySwing", "patientSelection", "compactContact"].map(OffensivePlateApproach.normalizeApproachPackage);
verify("12. Plate Selection 與 Swing Intent 分欄保存", mappings[0].selectionProfile === "aggressive" && mappings[0].swingIntent === "power" && mappings[1].selectionProfile === "selective" && mappings[1].swingIntent === "normal" && mappings[2].selectionProfile === "balanced" && mappings[2].swingIntent === "contact");

const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
verify("13. 正式 player PA path 不再存在 patientSelection 直接 walk mapping", !/patientSelection\s*:\s*\{[^}]*mixed\s*:\s*["']walk/.test(scriptSource) && !scriptSource.includes("getHighSchoolOffensivePlateAppearanceResult"));

const pending = OffensivePlateApproach.prepareNextPitch(state("patientSelection", { id: "reload" }), pitch("edgeStrike"));
const restored = OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(JSON.stringify(pending)));
const resolvedOriginal = OffensivePlateApproach.resolveNextPitch(pending, abilities);
const resolvedReload = OffensivePlateApproach.resolveNextPitch(restored, abilities);
verify("14. Save / Reload 保留 count、pending pitch 與 deterministic resolution", JSON.stringify(resolvedOriginal.state) === JSON.stringify(resolvedReload.state) && restored.pendingPitch.pitchId === pending.pendingPitch.pitchId);

const deterministicA = OffensivePlateApproach.simulatePlateAppearance({ matchId: "same", paId: "same-pa", batterId: "player", approach: "patientSelection", abilities });
const deterministicB = OffensivePlateApproach.simulatePlateAppearance({ matchId: "same", paId: "same-pa", batterId: "player", approach: "patientSelection", abilities });
verify("15. 相同 PA identity 產生相同 pitch sequence 與結果", JSON.stringify(deterministicA) === JSON.stringify(deterministicB));

verify("16. Meaningful offensive PA 不消耗 Match outcome RNG", evaluate(`(() => {const m=__opaMatch();let draws=0;const ok=resolveHighSchoolYearOneMatch("zone",m.currentMomentId,()=>{draws+=1;return .5;});return Boolean(ok)&&draws===0;})()`));

verify("17. 多球 player PA 在 simulation log 仍只記一次 PA", evaluate(`(() => {const m=__opaMatch();const before=m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.batterId==="player").length;__resolveOPA(m,"zone",[__pitch("clearBall"),__pitch("clearBall"),__pitch("chasePitch"),__pitch("clearBall")],[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]);const after=m.simulationLog.filter(e=>e.type==="plateAppearance"&&e.batterId==="player").length;return after===before+1&&m.offensivePlateAppearanceState.pitchNumber===4;})()`));

verify("18. 重複套用同一 PA 不會再次推進跑者", evaluate(`(() => {const m=__opaMatch({runners:["r1","r2","r3"]});const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="zone");const opts={plateAppearance:{pitchSequence:[__pitch("clearBall"),__pitch("clearBall"),__pitch("chasePitch"),__pitch("clearBall")],pitchOptions:[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]}};const first=resolveHighSchoolOffensiveDecision(m,c,null,opts);const snapshot=JSON.stringify({runners:m.runners,scores:m.scores,outs:m.outs,log:m.simulationLog.length});const second=resolveHighSchoolOffensiveDecision(m,c,null,opts);return Boolean(first)&&second===false&&snapshot===JSON.stringify({runners:m.runners,scores:m.scores,outs:m.outs,log:m.simulationLog.length});})()`));

verify("19. Match Experience 保持 one PA aggregated evidence", evaluate(`(() => {const m=__opaMatch();__resolveOPA(m,"zone",[__pitch("clearBall"),__pitch("clearBall"),__pitch("chasePitch"),__pitch("clearBall")],[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]);const ev=MatchExperienceDevelopment.deriveMatchExperienceEvidence(m,{exposure:{defensiveInnings:0,plateAppearances:1,role:"starter"}});return m.completedMoments.length===1&&m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length===1&&!m.simulationLog.some(x=>x.type==="pitch")&&ev.length>0;})()`));

verify("20. 空壘領先時進攻選項不再宣稱增加保險分", evaluate(`(() => {const m=__opaMatch({runners:[null,null,null],scores:{home:3,away:1}});return buildOffensiveDecisionChoices(m).every(x=>!x.text.includes("保險分"))&&!getHighSchoolOffensiveObjectiveContext(m).includes("保險分");})()`));

verify("21. canonical runner truth 正確處理滿壘四壞推進", evaluate(`(() => {const m=__opaMatch({runners:["r1","r2","r3"],scores:{home:1,away:1}});__resolveOPA(m,"zone",[__pitch("clearBall"),__pitch("clearBall"),__pitch("chasePitch"),__pitch("clearBall")],[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]);return m.scores.home===2&&m.runners.join()==="player,r1,r2"&&m.lastOffensiveResolution.resultCode==="walk";})()`));

verify("22. strikeout 經既有 runner pipeline 增加一個出局且不移動跑者", evaluate(`(() => {const m=__opaMatch({runners:["r1",null,null],outs:1});__resolveOPA(m,"zone",[__pitch("competitiveStrike"),__pitch("competitiveStrike"),__pitch("competitiveStrike")],[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]);return m.outs===2&&m.runners[0]==="r1"&&m.lastOffensiveResolution.resultCode==="strikeout";})()`));

verify("23. 進行中 PA state 通過 save normalization 不重抽 pending pitch", evaluate(`(() => {const m=__opaMatch();const c=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="zone");let s=ensureHighSchoolOffensivePlateAppearanceState(m,c);s=OffensivePlateApproach.prepareNextPitch(s,__pitch("edgeStrike"));m.offensivePlateAppearanceState=JSON.parse(JSON.stringify(s));player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch.offensivePlateAppearanceState;return restored.paIdentity===s.paIdentity&&restored.pitchNumber===0&&restored.pendingPitch.pitchId===s.pendingPitch.pitchId;})()`));

function runAudit(samplesPerApproach = 4000) {
  const approaches = ["aggressiveEarlySwing", "balancedAttack", "patientSelection", "compactContact"];
  const report = {};
  let nan = 0;
  let duplicatePA = 0;
  let rngDrift = 0;
  approaches.forEach(approach => {
    const totals = { pa: 0, BB: 0, K: 0, BIP: 0, hits: 0, extraBase: 0, pitches: 0, swings: 0, chaseSeen: 0, chaseSwings: 0, calledStrikes: 0, hitterSeen: 0, hitterTakes: 0, protectSeen: 0, protectSwings: 0, whiffs: 0 };
    for (let index = 0; index < samplesPerApproach; index += 1) {
      const input = { matchId: "audit", paId: `pa-${index}`, batterId: "player", approach, abilities, context: { hasRunner: index % 2 === 0, outs: index % 3 } };
      const resolved = OffensivePlateApproach.simulatePlateAppearance(input);
      const repeated = OffensivePlateApproach.simulatePlateAppearance(input);
      if (JSON.stringify(resolved) !== JSON.stringify(repeated)) rngDrift += 1;
      totals.pa += 1;
      totals.BB += resolved.result === "walk" ? 1 : 0;
      totals.K += resolved.result === "strikeout" ? 1 : 0;
      totals.BIP += ["out", "productiveOut", "single", "double", "triple", "homeRun"].includes(resolved.result) ? 1 : 0;
      totals.hits += ["single", "double", "triple", "homeRun"].includes(resolved.result) ? 1 : 0;
      totals.extraBase += ["double", "triple", "homeRun"].includes(resolved.result) ? 1 : 0;
      totals.pitches += resolved.pitchNumber;
      totals.swings += resolved.swingExecutionSummary.swings;
      totals.whiffs += resolved.swingExecutionSummary.whiffs;
      resolved.pitchHistory.forEach(item => {
        if (item.pitch.pitchLocationClass === "chasePitch") { totals.chaseSeen += 1; totals.chaseSwings += item.action === "swing" ? 1 : 0; }
        if (item.pitch.pitchLocationClass === "hitterPitch") { totals.hitterSeen += 1; totals.hitterTakes += item.action === "take" ? 1 : 0; }
        totals.calledStrikes += item.pitchResult === "calledStrike" ? 1 : 0;
        if (item.protectAdjusted && ["competitiveStrike", "edgeStrike"].includes(item.pitch.pitchLocationClass)) { totals.protectSeen += 1; totals.protectSwings += item.action === "swing" ? 1 : 0; }
      });
      if (![resolved.pitchNumber, resolved.balls, resolved.strikes, totals.swings].every(Number.isFinite)) nan += 1;
      if (!resolved.completed || !resolved.result) duplicatePA += 1;
    }
    report[approach] = {
      pa: totals.pa,
      walkRate: totals.BB / totals.pa,
      strikeoutRate: totals.K / totals.pa,
      ballInPlayRate: totals.BIP / totals.pa,
      hitRate: totals.hits / totals.pa,
      extraBaseRate: totals.extraBase / totals.pa,
      avgPitches: totals.pitches / totals.pa,
      swingRate: totals.swings / totals.pitches,
      chaseRate: totals.chaseSwings / totals.chaseSeen,
      calledStrikeRate: totals.calledStrikes / totals.pitches,
      hitterPitchTakeRate: totals.hitterTakes / totals.hitterSeen,
      twoStrikeProtectSwingRate: totals.protectSwings / totals.protectSeen,
      whiffRate: totals.whiffs / totals.swings
    };
  });
  return { samplesPerApproach, totalPA: samplesPerApproach * 4, approaches: report, nan, duplicatePA, rngDrift };
}

const audit = runAudit();
verify("24. 16,000 PA structural audit 完成且四種 package 均有 BB/K/BIP", Object.values(audit.approaches).every(item => item.pa === 4000 && item.walkRate > 0 && item.strikeoutRate > 0 && item.ballInPlayRate > 0));
verify("25. selective chase rate 低於 aggressive 且平均打席較長", audit.approaches.patientSelection.chaseRate < audit.approaches.aggressiveEarlySwing.chaseRate && audit.approaches.patientSelection.avgPitches > audit.approaches.aggressiveEarlySwing.avgPitches);
verify("26. selective 並非 walk-only 且 hitterPitch 仍明顯出棒", audit.approaches.patientSelection.ballInPlayRate > 0.2 && audit.approaches.patientSelection.hitterPitchTakeRate < 0.3);
verify("27. compact contact whiff 與 extra-base tendency 均低於 aggressive", audit.approaches.compactContact.whiffRate < audit.approaches.aggressiveEarlySwing.whiffRate && audit.approaches.compactContact.extraBaseRate < audit.approaches.aggressiveEarlySwing.extraBaseRate);
verify("28. structural audit 無 NaN、duplicate PA 或 RNG drift", audit.nan === 0 && audit.duplicatePA === 0 && audit.rngDrift === 0);

const calledThird = OffensivePlateApproach.resolveNextPitch(state("patientSelection", { id: "called-third", strikes: 2 }), abilities, { pitch: pitch("edgeStrike"), decisionRoll: 0.99, recognitionRoll: 0 });
verify("29. calledStrike 必須來自 take 且沒有 contact", calledThird.event.pitchResult === "calledStrike" && calledThird.event.action === "take" && calledThird.event.contact === null);

const swingingThird = OffensivePlateApproach.resolveNextPitch(state("patientSelection", { id: "swinging-third", strikes: 2 }), abilities, { pitch: pitch("edgeStrike"), decisionRoll: 0, contactRoll: 1, recognitionRoll: 0 });
verify("30. swingingStrike 必須來自 swing 且 contact=false", swingingThird.event.pitchResult === "swingingStrike" && swingingThird.event.action === "swing" && swingingThird.event.contact === false);

const foulContact = OffensivePlateApproach.resolveNextPitch(state("compactContact", { id: "foul-integrity", strikes: 2 }), abilities, { pitch: pitch("competitiveStrike"), decisionRoll: 0, contactRoll: 0, foulRoll: 0 });
verify("31. foul 必須來自 swing + contact", foulContact.event.pitchResult === "foul" && foulContact.event.action === "swing" && foulContact.event.contact === true && foulContact.state.strikes === 2);

const bipContact = OffensivePlateApproach.resolveNextPitch(state("balancedAttack", { id: "bip-integrity" }), abilities, { pitch: pitch("competitiveStrike"), decisionRoll: 0, contactRoll: 0, foulRoll: 1, outcomeRoll: 0 });
verify("32. ballInPlay 必須來自 swing + contact", bipContact.event.pitchResult === "ballInPlay" && bipContact.event.action === "swing" && bipContact.event.contact === true);
verify("33. ballInPlay terminal 不可能同時是 strikeout", bipContact.state.result !== "strikeout" && ["out", "productiveOut", "single", "double", "triple", "homeRun"].includes(bipContact.state.result));

verify("34. called third strike 文案只描述放掉與主審判定", evaluate(`(() => {const s=OffensivePlateApproach.simulatePlateAppearance({state:OffensivePlateApproach.createPlateAppearanceState({matchId:"word",paId:"called",batterId:"player",approach:"patientSelection",strikes:2}),abilities:getHighSchoolOffensivePlateApproachAbilities(player),pitchSequence:[__pitch("edgeStrike")],pitchOptions:[{decisionRoll:.99,recognitionRoll:0}]});const text=formatHighSchoolOffensivePlayerFacingResult({approach:"patientSelection",swingIntent:"normal"},s.result,{runnersScored:[],runnersAdvanced:[],runnersHeld:[],batterSafe:false,batterOut:true,halfInningEnded:false,basesEmptyAfter:true},s).outcome;return text.includes("放掉")&&text.includes("主審判定第三好球")&&!text.includes("出棒")&&!text.includes("進場內");})()`));
verify("35. swinging third strike 文案只描述出棒揮空", evaluate(`(() => {const s=OffensivePlateApproach.simulatePlateAppearance({state:OffensivePlateApproach.createPlateAppearanceState({matchId:"word",paId:"swing",batterId:"player",approach:"patientSelection",strikes:2}),abilities:getHighSchoolOffensivePlateApproachAbilities(player),pitchSequence:[__pitch("edgeStrike")],pitchOptions:[{decisionRoll:0,contactRoll:1,recognitionRoll:0}]});const text=formatHighSchoolOffensivePlayerFacingResult({approach:"patientSelection",swingIntent:"normal"},s.result,{runnersScored:[],runnersAdvanced:[],runnersHeld:[],batterSafe:false,batterOut:true,halfInningEnded:false,basesEmptyAfter:true},s).outcome;return text.includes("出棒")&&text.includes("揮擊落空")&&!text.includes("主審判定")&&!text.includes("進場內");})()`));
verify("36. pitch history 的 countBefore / countAfter 連續一致", selectiveWalk.pitchHistory.every((item, index, history) => index === 0 || JSON.stringify(item.countBefore) === JSON.stringify(history[index - 1].countAfter)));
verify("37. terminal PA result 與最後 canonical pitch result 一致", [selectiveWalk, calledThird.state, swingingThird.state, bipContact.state].every(resolved => { const last = resolved.pitchHistory.at(-1); return resolved.result === "walk" ? last.pitchResult === "ball" : resolved.result === "strikeout" ? ["calledStrike", "swingingStrike"].includes(last.pitchResult) : last.pitchResult === "ballInPlay"; }));
verify("38. two-strike edge fixture 同時涵蓋合法 take-K 與 swing-K", calledThird.state.result === "strikeout" && swingingThird.state.result === "strikeout" && calledThird.event.protectAdjusted && swingingThird.event.protectAdjusted);

verify("39. 第一個 meaningful offensive PA 可 admission", evaluate(`(() => {const m=__opportunityMatch();const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());return c.leverageClass==="highLeverage"&&evaluateHighSchoolOffensiveDecisionDensity(m,c).allowed;})()`));
verify("40. 前次 offensive decision 不會永久阻擋第二個 critical PA", evaluate(`(() => {const m=__opportunityMatch({inning:3,scores:{home:1,away:1},runners:[null,"r2",null]});let c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());let d=evaluateHighSchoolOffensiveDecisionDensity(m,c,{forceScripted:true});applyHighSchoolOffensiveDecisionDensity(m,c,d,true);m.inning=7;m.outs=2;m.scores={home:1,away:2};m.runners=[null,"r2",null];m.simulationLog=[{type:"plateAppearance",batterId:"player"}];c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());d=evaluateHighSchoolOffensiveDecisionDensity(m,c);return m.matchDecisionDensityState.offensiveDecisionCount===1&&c.leverageClass==="critical"&&d.allowed&&d.highLeverageOverride;})()`));
verify("41. 7局下落後1分、二壘有人、兩出局為 critical 並 admission", evaluate(`(() => {const m=__opportunityMatch({outs:2,runners:[null,"r2",null]});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());return c.leverageClass==="critical"&&evaluateHighSchoolOffensiveDecisionDensity(m,c).allowed;})()`));
verify("42. 7局下落後1分、壘上無人仍可 admission", evaluate(`(() => {const m=__opportunityMatch({outs:0,runners:[null,null,null]});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());return c.leverageClass==="highLeverage"&&evaluateHighSchoolOffensiveDecisionDensity(m,c).allowed;})()`));
verify("43. 7局下落後8分、壘上無人可 routine suppress", evaluate(`(() => {const m=__opportunityMatch({outs:2,scores:{home:1,away:9}});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const d=evaluateHighSchoolOffensiveDecisionDensity(m,c);return c.leverageClass==="routine"&&!d.allowed&&d.suppressionReason==="routine-opportunity";})()`));
verify("44. 終局大幅領先不會因第7局自動 admission", evaluate(`(() => {const m=__opportunityMatch({scores:{home:9,away:2}});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());return c.leverageClass==="routine"&&!evaluateHighSchoolOffensiveDecisionDensity(m,c).allowed;})()`));
verify("45. 相同低度 meaningful 結構連續出現可 soft suppress", evaluate(`(() => {const m=__opportunityMatch({inning:6,scores:{home:2,away:3},runners:["r1",null,null]});let c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());let d=evaluateHighSchoolOffensiveDecisionDensity(m,c);applyHighSchoolOffensiveDecisionDensity(m,c,d,true);m.simulationLog=[{type:"plateAppearance",batterId:"player"}];c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());d=evaluateHighSchoolOffensiveDecisionDensity(m,c);return c.leverageClass==="meaningful"&&!d.allowed&&d.repeated&&d.suppressionReason==="repeated-routine-structure";})()`));
verify("46. critical PA 可突破一般 repetition suppression", evaluate(`(() => {const m=__opportunityMatch({outs:2,runners:[null,"r2",null]});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());m.matchDecisionDensityState.lastOffensiveNoveltyKey=c.noveltyKey;m.matchDecisionDensityState.lastOffensiveDecisionPA=0;const d=evaluateHighSchoolOffensiveDecisionDensity(m,c);return d.repeated&&d.highLeverageOverride&&d.allowed;})()`));
verify("47. zero-offensive-decision game 合法", evaluate(`(() => {const m=__opportunityMatch({scores:{home:9,away:2}});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const d=evaluateHighSchoolOffensiveDecisionDensity(m,c);applyHighSchoolOffensiveDecisionDensity(m,c,d,false);return m.matchDecisionDensityState.offensiveDecisionCount===0;})()`));
verify("48. multi-offensive-decision game 合法", evaluate(`(() => {const m=__opportunityMatch();let c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());let d=evaluateHighSchoolOffensiveDecisionDensity(m,c);applyHighSchoolOffensiveDecisionDensity(m,c,d,true);m.simulationLog=[{type:"plateAppearance",batterId:"player"}];m.outs=2;m.runners=[null,"r2",null];c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());d=evaluateHighSchoolOffensiveDecisionDensity(m,c);applyHighSchoolOffensiveDecisionDensity(m,c,d,true);return m.matchDecisionDensityState.offensiveDecisionCount===2;})()`));
verify("49. scripted first offense 不消耗永久 quota", evaluate(`(() => {const m=__opportunityMatch({inning:2,scores:{home:6,away:1}});let c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());let d=evaluateHighSchoolOffensiveDecisionDensity(m,c,{forceScripted:true});applyHighSchoolOffensiveDecisionDensity(m,c,d,true);m.inning=7;m.outs=2;m.scores={home:1,away:2};m.runners=[null,"r2",null];m.simulationLog=[{type:"plateAppearance",batterId:"player"}];c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());d=evaluateHighSchoolOffensiveDecisionDensity(m,c);return d.allowed;})()`));
verify("50. legacy finalOffense route 保留 moment_3 contract", evaluate(`(() => {const m=__opaMatch({momentIndex:2});m.simulationPhase="moment_2_resolved";m.currentDomain="flow";const event=prepareHighSchoolFinalOffensiveMomentFromSimulation(m);return event.momentId===highSchoolYearOneMomentIds[2]&&m.simulationPhase==="moment_3_ready"&&m.pendingOffensiveOpportunity.resumePhase==="moment_3_resolved";})()`));
verify("51. save/reload 保留 pending opportunity classification 與 density", evaluate(`(() => {const m=__opaMatch({momentIndex:2});m.simulationPhase="moment_2_resolved";m.currentDomain="flow";prepareHighSchoolFinalOffensiveMomentFromSimulation(m);player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch.pendingOffensiveOpportunity;return restored.status==="pending"&&restored.classification.leverageClass&&restored.density.allowed===true&&restored.momentId===m.currentMomentId;})()`));
verify("52. classified opportunity 與 density evaluation deterministic 且不消耗 RNG", evaluate(`(() => {const m=__opportunityMatch();let draws=0;const before=JSON.stringify([classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices()),evaluateHighSchoolOffensiveDecisionDensity(m,classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices()))]);const after=JSON.stringify([classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices()),evaluateHighSchoolOffensiveDecisionDensity(m,classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices()))]);return before===after&&draws===0;})()`));

const opportunityAudit = JSON.parse(JSON.stringify(evaluate(`__runOpportunityAudit(2000)`)));
verify("53. 2,000 場 opportunity audit 同時存在 zero 與 multi-decision games", opportunityAudit.buckets.zero > 0 && (opportunityAudit.buckets.two + opportunityAudit.buckets.three + opportunityAudit.buckets.fourPlus) > 0);
verify("54. opportunity audit 有 late/critical admission 與 routine suppression", opportunityAudit.totals.lateMeaningfulCandidates > 0 && opportunityAudit.totals.lateAdmitted > 0 && opportunityAudit.totals.criticalCandidates > 0 && opportunityAudit.totals.criticalAdmitted > 0 && opportunityAudit.totals.routineSuppressed > 0);
verify("55. opportunity audit 無 illegal admission、duplicate、freeze、cursor/RNG drift 或 NaN", [opportunityAudit.totals.illegalAdmission, opportunityAudit.totals.duplicatePA, opportunityAudit.totals.freeze, opportunityAudit.totals.cursorDrift, opportunityAudit.totals.rngDrift, opportunityAudit.totals.nan].every(value => value === 0));
verify("56. classified second decision 只 consume 一次 PA 並回到原 playback phase", evaluate(`(() => {const m=__opaMatch({momentIndex:2,runners:[null,"r2",null],outs:2,scores:{home:1,away:2}});m.inning=7;m.simulationPhase="moment_3_resolved";m.currentDomain="flow";const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const d=evaluateHighSchoolOffensiveDecisionDensity(m,c);applyHighSchoolOffensiveDecisionDensity(m,c,d,true);prepareHighSchoolMeaningfulOffensiveMomentFromSimulation(m,c,d);const choice=getHighSchoolYearOneMatchMomentChoices(m).find(item=>item.matchDecision==="zone");const cursor=m.presentedEventCursor;const before=m.simulationLog.filter(item=>item.type==="plateAppearance"&&item.batterId==="player").length;const first=resolveHighSchoolOffensiveDecision(m,choice,null,{resolvedPhase:m.pendingOffensiveOpportunity.resumePhase,plateAppearance:{pitchSequence:[__pitch("competitiveStrike"),__pitch("competitiveStrike"),__pitch("competitiveStrike")],pitchOptions:[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]}});const snapshot=JSON.stringify({log:m.simulationLog.length,runners:m.runners,outs:m.outs});const second=resolveHighSchoolOffensiveDecision(m,choice,null,{resolvedPhase:"moment_3_resolved"});const after=m.simulationLog.filter(item=>item.type==="plateAppearance"&&item.batterId==="player").length;return Boolean(first)&&second===false&&after===before+1&&m.simulationPhase==="moment_3_resolved"&&m.presentedEventCursor===cursor&&snapshot===JSON.stringify({log:m.simulationLog.length,runners:m.runners,outs:m.outs});})()`));

verify("57. 7局下 critical PA 同時保留 leverage 與 late-game agency", evaluate(`(() => {const m=__agencyMatch({scores:{home:1,away:2},runners:[null,"r2",null]});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const a=evaluateHighSchoolOffensivePlayerAgency(m,c);const reached=__reachAgency(m);return c.leverageClass==="critical"&&a.lateGamePlayerAgency&&reached.result==="decision"&&reached.choices.map(x=>x.text).join()==="自己打,交給模擬";})()`));
verify("58. 7局下落後8分 routine PA 仍取得 agency participation choice", evaluate(`(() => {const m=__agencyMatch();const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const a=evaluateHighSchoolOffensivePlayerAgency(m,c);const reached=__reachAgency(m);return c.leverageClass==="routine"&&a.lateGamePlayerAgency&&reached.state.leverageClass==="routine"&&reached.choices.length===2;})()`));
verify("59. 6局下落後8分 routine PA 不建立 late-game agency", evaluate(`(() => {const m=__agencyMatch({inning:6});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());return c.leverageClass==="routine"&&!evaluateHighSchoolOffensivePlayerAgency(m,c).lateGamePlayerAgency;})()`));
verify("60. 第7局未輪到玩家時不製造假 PA 或 participation choice", evaluate(`(() => {const m=__agencyMatch();m.battingOrderIndex.home=(m.battingOrderIndex.home+1)%m.rosters.home.lineup.length;const before=m.simulationLog.filter(x=>x.type==="plateAppearance").length;const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const a=evaluateHighSchoolOffensivePlayerAgency(m,c);return !a.playerBatting&&!a.lateGamePlayerAgency&&m.offensivePlayerAgencyState===null&&m.simulationLog.filter(x=>x.type==="plateAppearance").length===before;})()`));
verify("61. 選自己打後進入既有 Plate Approach 並只完成一個 PA", evaluate(`(() => {const m=__agencyMatch();__reachAgency(m);const agencyId=m.offensivePlayerAgencyState.momentId;const before=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;if(!chooseHighSchoolOffensiveAgency("manual",agencyId))return false;const choice=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="zone");const moment=resolveHighSchoolOffensiveDecision(m,choice,null,{resolvedPhase:m.pendingOffensiveOpportunity.resumePhase,plateAppearance:{pitchSequence:[__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall")],pitchOptions:[{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99},{decisionRoll:.99}]}});const after=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;return Boolean(moment)&&after===before+1&&m.offensivePlayerAgencyState.selection==="manual"&&m.offensivePlayerAgencyState.status==="resolved"&&m.offensivePlayerAgencyState.resultApplied;})()`));
verify("62. 選交給模擬使用既有 simulator 並只推進一次 batting cursor", evaluate(`(() => {const m=__agencyMatch();__reachAgency(m);const state=m.offensivePlayerAgencyState;const beforePA=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;const beforeOrder=m.battingOrderIndex.home;const beforePlayer=JSON.stringify({skills:player.baseballSkills,relationships:player.relationships,coach:player.highSchoolCoachEvaluation});const ok=chooseHighSchoolOffensiveAgency("simulate",state.momentId);const afterPA=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;const snapshot=JSON.stringify({pa:afterPA,order:m.battingOrderIndex.home,scores:m.scores,runners:m.runners,outs:m.outs,log:m.simulationLog.length});const duplicate=chooseHighSchoolOffensiveAgency("simulate",state.momentId);return ok&&duplicate===false&&afterPA===beforePA+1&&m.battingOrderIndex.home===(beforeOrder+1)%m.rosters.home.lineup.length&&state.status==="resolved"&&state.resultApplied&&snapshot===JSON.stringify({pa:m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length,order:m.battingOrderIndex.home,scores:m.scores,runners:m.runners,outs:m.outs,log:m.simulationLog.length})&&beforePlayer===JSON.stringify({skills:player.baseballSkills,relationships:player.relationships,coach:player.highSchoolCoachEvaluation});})()`));
verify("63. 第8局與後續合法延長局維持 late-game agency", evaluate(`(() => {const m=__agencyMatch({inning:8,scores:{home:3,away:4}});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());return evaluateHighSchoolOffensivePlayerAgency(m,c).lateGamePlayerAgency;})()`));
verify("64. game terminal 後不建立 agency opportunity", evaluate(`(() => {const m=__agencyMatch();m.completed=true;const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const a=evaluateHighSchoolOffensivePlayerAgency(m,c);return !a.gameLive&&!a.lateGamePlayerAgency;})()`));
verify("65. participation UI 文案只表達操作方式，沒有消極或懲罰語意", evaluate(`(() => {const m=__agencyMatch();__reachAgency(m);const labels=getHighSchoolOffensiveAgencyChoices(m).map(x=>x.text);const html=renderHighSchoolOffensiveAgencyContext(m);return labels.join()==="自己打,交給模擬"&&html.includes("只決定由你操作或交給比賽模擬")&&!/放棄|消極|扣分|能力下降/.test(html);})()`));
verify("66. reload 前尚未選擇時保留同一 agency participation choice", evaluate(`(() => {const m=__agencyMatch();__reachAgency(m);player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.simulationPhase==="offensive_agency_ready"&&restored.offensivePlayerAgencyState.status==="pending"&&restored.offensivePlayerAgencyState.agencyIdentity===m.offensivePlayerAgencyState.agencyIdentity&&isHighSchoolMatchDecisionVisible(restored)&&getHighSchoolOffensiveAgencyChoices(restored).length===2;})()`));
verify("67. manual selection 後進行中 PA reload 不重抽 pending pitch", evaluate(`(() => {const m=__agencyMatch();__reachAgency(m);const id=m.offensivePlayerAgencyState.momentId;chooseHighSchoolOffensiveAgency("manual",id);const choice=getHighSchoolYearOneMatchMomentChoices(m).find(x=>x.matchDecision==="zone");let pa=ensureHighSchoolOffensivePlateAppearanceState(m,choice);pa=OffensivePlateApproach.prepareNextPitch(pa,__pitch("edgeStrike"));m.offensivePlateAppearanceState=JSON.parse(JSON.stringify(pa));player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.offensivePlayerAgencyState.selection==="manual"&&restored.offensivePlayerAgencyState.status==="manualReady"&&restored.offensivePlateAppearanceState.paIdentity===pa.paIdentity&&restored.offensivePlateAppearanceState.pendingPitch.pitchId===pa.pendingPitch.pitchId;})()`));
verify("68. simulate selection 完成後 reload 不重新詢問或重複模擬", evaluate(`(() => {const m=__agencyMatch();__reachAgency(m);const id=m.offensivePlayerAgencyState.momentId;chooseHighSchoolOffensiveAgency("simulate",id);player.highSchoolMatch=m;const before=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const c=classifyHighSchoolOffensiveOpportunity(restored,__opportunityChoices());const a=evaluateHighSchoolOffensivePlayerAgency(restored,c);return restored.offensivePlayerAgencyState.status==="resolved"&&restored.offensivePlayerAgencyState.resultApplied&&!a.lateGamePlayerAgency&&restored.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length===before;})()`));
verify("69. 先前多次 offensive decision 不會封鎖第7局 routine agency", evaluate(`(() => {const m=__agencyMatch();Object.assign(m.matchDecisionDensityState,{offensiveDecisionCount:2,lastOffensiveDecisionPA:2,lastOffensiveNoveltyKey:"old",recentOffensiveSituationFamilies:["old"]});m.simulationLog.push({type:"plateAppearance",batterId:"player"},{type:"plateAppearance",batterId:"player"});const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const d=evaluateHighSchoolOffensiveDecisionDensity(m,c);const a=evaluateHighSchoolOffensivePlayerAgency(m,c);return c.leverageClass==="routine"&&!d.allowed&&a.lateGamePlayerAgency;})()`));
verify("70. Agency evaluation deterministic 且不消耗 Match RNG", evaluate(`(() => {const m=__agencyMatch();const c=classifyHighSchoolOffensiveOpportunity(m,__opportunityChoices());const cursor=m.simulationCursor;const a=JSON.stringify(evaluateHighSchoolOffensivePlayerAgency(m,c));const b=JSON.stringify(evaluateHighSchoolOffensivePlayerAgency(m,c));return a===b&&m.simulationCursor===cursor;})()`));

const agencyAudit = JSON.parse(JSON.stringify(evaluate(`__runAgencyAudit(2000)`)));
verify("71. 2,000 場 agency audit 涵蓋 late-game 與 routine agency", agencyAudit.gamesSampled === 2000 && agencyAudit.lateGamePlayerPA > 0 && agencyAudit.lateGameAgencyOpportunities === agencyAudit.lateGamePlayerPA && agencyAudit.lateGameRoutineAgency > 0);
verify("72. agency audit 同時涵蓋 manual 與 simulate ownership fixtures", agencyAudit.manualPathFixtures > 0 && agencyAudit.simulatePathFixtures > 0);
verify("73. agency audit 無 duplicate/skipped PA、cursor drift、freeze、RNG 或 NaN", [agencyAudit.duplicatePA, agencyAudit.skippedPA, agencyAudit.cursorDrift, agencyAudit.freeze, agencyAudit.rngIntegrity, agencyAudit.nan].every(value => value === 0));

const accountingFixture = types => JSON.parse(JSON.stringify(evaluate(`__canonicalAccountingFixture(${JSON.stringify(types)})`)));
const allAutomaticAccounting = accountingFixture(["automatic", "automatic", "automatic", "automatic"]);
verify("74. All Automatic：canonical／Game Exposure／Settlement 均為 4 PA", allAutomaticAccounting.ok && allAutomaticAccounting.accounting.canonicalPlayerPACompleted === 4 && allAutomaticAccounting.accounting.gameExposurePA === 4 && allAutomaticAccounting.accounting.settlementDisplayedPA === 4 && allAutomaticAccounting.accounting.offensiveDecisionCount === 0);

const mixedAccounting = accountingFixture(["automatic", "manualBIP", "automatic", "agencySimulate"]);
verify("75. Mixed Ownership：automatic／manual／late-game simulate 仍只結算 4 PA", mixedAccounting.ok && mixedAccounting.accounting.canonicalPlayerPACompleted === 4 && mixedAccounting.accounting.gameExposurePA === 4 && mixedAccounting.accounting.settlementDisplayedPA === 4 && mixedAccounting.accounting.offensiveDecisionCount < 4);

const multipleManualAccounting = accountingFixture(["manualWalk", "manualK", "automatic", "agencyManual"]);
verify("76. Multiple Manual Decisions：4 PA 中 3 次 meaningful decision 不會改寫 PA count", multipleManualAccounting.ok && multipleManualAccounting.accounting.canonicalPlayerPACompleted === 4 && multipleManualAccounting.accounting.gameExposurePA === 4 && multipleManualAccounting.accounting.settlementDisplayedPA === 4 && multipleManualAccounting.accounting.offensiveDecisionCount === 3);

const multiPitchAccounting = accountingFixture(["multiPitch"]);
verify("77. 10-pitch manual PA 僅增加一個 canonical／Exposure／Settlement PA", multiPitchAccounting.ok && multiPitchAccounting.accounting.canonicalPlayerPACompleted === 1 && multiPitchAccounting.accounting.gameExposurePA === 1 && multiPitchAccounting.accounting.settlementDisplayedPA === 1 && multiPitchAccounting.accounting.canonicalEvents[0].pitchCount >= 8);

const walkAccounting = accountingFixture(["manualWalk"]);
verify("78. Walk 結果只完成一個 PA", walkAccounting.ok && walkAccounting.accounting.canonicalPlayerPACompleted === 1 && walkAccounting.accounting.canonicalEvents[0].result === "walk");
const strikeoutAccounting = accountingFixture(["manualK"]);
verify("79. Strikeout 結果只完成一個 PA", strikeoutAccounting.ok && strikeoutAccounting.accounting.canonicalPlayerPACompleted === 1 && strikeoutAccounting.accounting.canonicalEvents[0].result === "strikeout");
const bipAccounting = accountingFixture(["manualBIP"]);
verify("80. Ball In Play 結果只完成一個 PA", bipAccounting.ok && bipAccounting.accounting.canonicalPlayerPACompleted === 1 && ["out", "productiveOut", "single", "double", "triple", "homeRun"].includes(bipAccounting.accounting.canonicalEvents[0].result));

const reloadAccounting = JSON.parse(JSON.stringify(evaluate(`__midPACanonicalReloadFixture()`)));
verify("81. 2-2 mid-PA Save／Reload 後只完成並結算一個 PA", reloadAccounting.ok && reloadAccounting.pitchCount === 5 && reloadAccounting.accounting.canonicalPlayerPACompleted === 1 && reloadAccounting.accounting.gameExposurePA === 1 && reloadAccounting.accounting.settlementDisplayedPA === 1);

const agencyManualAccounting = accountingFixture(["agencyManual"]);
verify("82. Late-game Agency Manual 僅完成一個 canonical PA", agencyManualAccounting.ok && agencyManualAccounting.accounting.canonicalPlayerPACompleted === 1 && agencyManualAccounting.accounting.gameExposurePA === 1 && agencyManualAccounting.accounting.settlementDisplayedPA === 1);
const agencySimulatedAccounting = accountingFixture(["agencySimulate"]);
verify("83. Late-game Agency Simulate 僅完成一個 canonical PA", agencySimulatedAccounting.ok && agencySimulatedAccounting.accounting.canonicalPlayerPACompleted === 1 && agencySimulatedAccounting.accounting.gameExposurePA === 1 && agencySimulatedAccounting.accounting.settlementDisplayedPA === 1);

const substituteAccounting = JSON.parse(JSON.stringify(evaluate(`__substituteCanonicalFixture()`)));
verify("84. Substitute／Partial Appearance 只結算實際完成的 2 PA", substituteAccounting.ok && substituteAccounting.accounting.canonicalPlayerPACompleted === 2 && substituteAccounting.accounting.gameExposurePA === 2 && substituteAccounting.accounting.settlementDisplayedPA === 2);

const canonicalPAAudit = JSON.parse(JSON.stringify(evaluate(`__runCanonicalPAAccountingAudit(2000)`)));
verify("85. 2,000 場 PA accounting audit 涵蓋 0／1／2／3／4／5+ PA", canonicalPAAudit.gamesSampled === 2000 && Object.values(canonicalPAAudit.distribution).every(value => value > 0));
verify("86. 2,000 場 canonical／Game Exposure／Settlement mismatch 均為 0", canonicalPAAudit.gameExposureMismatch === 0 && canonicalPAAudit.settlementDisplayMismatch === 0);
verify("87. PA audit 涵蓋 manual、automatic、agency、multi-pitch、BB、K、BIP", [canonicalPAAudit.manualPA, canonicalPAAudit.automaticPA, canonicalPAAudit.lateGameAgencyManualPA, canonicalPAAudit.lateGameAgencySimulatedPA, canonicalPAAudit.multiPitchPA, canonicalPAAudit.walkPA, canonicalPAAudit.strikeoutPA, canonicalPAAudit.bipPA].every(value => value > 0));
verify("88. PA audit 無 duplicate／skip／cursor drift／freeze／RNG／NaN", [canonicalPAAudit.duplicatePA, canonicalPAAudit.skippedPA, canonicalPAAudit.duplicateBattingOrderAdvancement, canonicalPAAudit.cursorDrift, canonicalPAAudit.freeze, canonicalPAAudit.rngIntegrityError, canonicalPAAudit.nan].every(value => value === 0));

const presentationFixture = (result, variant = "selective") => JSON.parse(JSON.stringify(evaluate(`(() => {const s=__presentationState("${result}","${variant}");const c=__presentationChoice("${variant}");return {outcome:formatHighSchoolOffensivePlayerFacingResult(c,"${result}",__presentationMeaning("${result}"),s).outcome,execution:formatHighSchoolOffensiveExecutionText(c,s),feedback:formatHighSchoolOffensiveCoachFeedback(c,s),state:s};})()`)));
verify("89. single 明確顯示一壘安打", presentationFixture("single").outcome.includes("一壘安打"));
verify("90. double 明確顯示二壘安打", presentationFixture("double", "aggressive").outcome.includes("二壘安打"));
verify("91. triple 明確顯示三壘安打而非僅安全上壘", presentationFixture("triple").outcome.includes("三壘安打") && !presentationFixture("triple").outcome.includes("依實際擊球結果"));
verify("92. homeRun 明確顯示全壘打", presentationFixture("homeRun", "aggressive").outcome.includes("全壘打"));
verify("93. walk 明確顯示四壞保送", presentationFixture("walk").outcome.includes("四壞保送"));
verify("94. called strikeout 保留目送第三好球語意", presentationFixture("strikeout", "called").outcome.includes("主審判定第三好球") && !presentationFixture("strikeout", "called").outcome.includes("揮擊落空"));
verify("95. swinging strikeout 保留出棒揮空語意", presentationFixture("strikeout", "swinging").outcome.includes("揮擊落空") && !presentationFixture("strikeout", "swinging").outcome.includes("主審判定"));
verify("96. generic out 顯示打者出局且不宣稱安全上壘", presentationFixture("out").outcome.includes("出局") && !presentationFixture("out").outcome.includes("安全上壘"));

const walkPresentation = presentationFixture("walk");
verify("97. selective 四壞獲得攻擊區紀律與 no-chase 回饋", walkPresentation.feedback.includes("攻擊區") && walkPresentation.feedback.includes("沒有被壞球帶走"));
verify("98. no-swing PA 不會收到 swing timing 批評", walkPresentation.state.swingExecutionSummary.swings === 0 && !/(出棒慢|揮棒太晚|沒有跟上|動作慢)/.test(walkPresentation.feedback));
verify("99. no-contact PA 不會收到 contact quality 批評", !/(擊球點偏|打得太薄|接觸品質|contact quality)/i.test(walkPresentation.feedback));
verify("100. selective called K 回饋要求調整兩好球保護區", presentationFixture("strikeout", "called").feedback.includes("保護範圍") && !presentationFixture("strikeout", "called").feedback.includes("動作慢"));
verify("101. swinging K 分離合理判斷與未完成執行", presentationFixture("strikeout", "swinging").feedback.includes("判斷方向合理") && presentationFixture("strikeout", "swinging").feedback.includes("沒有跟上"));
verify("102. good decision + lineout 不被改寫成判斷錯誤", presentationFixture("out").feedback.includes("攻擊選擇合理") && !presentationFixture("out").feedback.includes("判斷錯誤"));
verify("103. poor decision + lucky hit 仍指出非理想攻擊球", presentationFixture("single", "chase").feedback.includes("結果雖然上壘") && presentationFixture("single", "chase").feedback.includes("不是理想的攻擊選擇"));
verify("104. aggressive first-pitch hit 回饋辨識提前準備", presentationFixture("double", "aggressive").feedback.includes("提早準備") && presentationFixture("double", "aggressive").feedback.includes("第一顆可攻擊球"));
verify("105. compact contact 回饋辨識縮短揮棒與延長打席", presentationFixture("single", "contact").feedback.includes("縮短揮棒") && presentationFixture("single", "contact").feedback.includes("延長了打席"));
verify("106. presentation state reload 後 outcome 與 feedback 完全一致", evaluate(`(() => {const s=__presentationState("triple","selective");const c=__presentationChoice("selective");const first=[formatHighSchoolOffensivePlayerFacingResult(c,s.result,__presentationMeaning(s.result),s).outcome,formatHighSchoolOffensiveCoachFeedback(c,s)];const loaded=OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(JSON.stringify(s)));const second=[formatHighSchoolOffensivePlayerFacingResult(c,loaded.result,__presentationMeaning(loaded.result),loaded).outcome,formatHighSchoolOffensiveCoachFeedback(c,loaded)];return JSON.stringify(first)===JSON.stringify(second);})()`));
verify("107. presentation 與 feedback 不消耗 Match RNG 且不修改 Match Truth", evaluate(`(() => {const m=__opaMatch({seed:94700});const s=__presentationState("triple","selective");const c=__presentationChoice("selective");const before=JSON.stringify({cursor:m.simulationCursor,scores:m.scores,runners:m.runners,outs:m.outs,experience:m.matchExperience});formatHighSchoolOffensivePlayerFacingResult(c,s.result,__presentationMeaning(s.result),s);formatHighSchoolOffensiveExecutionText(c,s);formatHighSchoolOffensiveCoachFeedback(c,s);return before===JSON.stringify({cursor:m.simulationCursor,scores:m.scores,runners:m.runners,outs:m.outs,experience:m.matchExperience});})()`));
verify("108. 正式 selective walk resolution 保存 evidence-based execution 與 coach feedback", evaluate(`(() => {const m=__opaMatch();const moment=__resolveOPA(m,"zone",[__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall")],Array.from({length:4},()=>({decisionRoll:.99,recognitionRoll:0})));return moment.resultCode==="walk"&&moment.executionText.includes("連續放掉")&&moment.coachFeedback.includes("沒有被壞球帶走")&&m.coachReaction===moment.coachFeedback&&!m.coachReaction.includes("慢");})()`));

const presentationAudit = JSON.parse(JSON.stringify(evaluate(`__runOffensivePresentationAudit(3000)`)));
verify("109. 3,000 PA presentation audit 的 semantic mismatch、guard violation、RNG drift 與 NaN 均為 0", Object.entries(presentationAudit).filter(([key]) => key !== "samples").every(([, value]) => value === 0));
verify("110. 結果卡優先呈現該 offensive PA 的 evidence-based coach feedback", evaluate(`(() => {const m=__opaMatch();player.highSchoolMatch=m;m.coachReaction="舊的動作慢評語";const feedback="現任教練記下這次進攻：攻擊區守得很清楚，沒有被壞球帶走。";renderYouthSeasonOutcome("high_school_showcase",{text:"等球進攻擊區",executionText:"連續放掉壞球",memory:"球數走到四壞，你取得四壞保送。",coachFeedback:feedback},"");const html=document.getElementById("story").innerHTML;return html.includes(feedback)&&!html.includes("舊的動作慢評語");})()`));
verify("111. resolved PA 經正式 save normalization 保留 result text 與 feedback category", evaluate(`(() => {const m=__opaMatch();const moment=__resolveOPA(m,"zone",[__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall"),__pitch("clearBall")],Array.from({length:4},()=>({decisionRoll:.99,recognitionRoll:0})));const before={outcome:moment.outcome,feedback:moment.coachFeedback};player.highSchoolMatch=m;player=normalizeSave(JSON.parse(JSON.stringify(player)));const loaded=player.highSchoolMatch.completedMoments.at(-1);return loaded.outcome===before.outcome&&loaded.coachFeedback===before.feedback&&player.highSchoolMatch.lastOffensiveResolution.coachFeedback===before.feedback;})()`));

const aggressiveSinglePresentation = presentationFixture("single", "aggressive");
verify("112. reported bug：aggressive + single 保留提早攻擊與一壘安打語意", aggressiveSinglePresentation.execution.includes("提早") && aggressiveSinglePresentation.execution.includes("第一顆") && aggressiveSinglePresentation.outcome.includes("一壘安打"));
verify("113. reported bug：aggressive + single 不洩漏 compact／patient 語意", !/(縮短揮棒|耐心等待|放掉邊角球)/.test(aggressiveSinglePresentation.execution + aggressiveSinglePresentation.outcome));

const attributionFixtures = {
  aggressiveOut: presentationFixture("out", "aggressive"),
  aggressiveDouble: presentationFixture("double", "aggressive"),
  patientSingle: presentationFixture("single", "selective"),
  patientWalk: presentationFixture("walk", "selective"),
  compactSingle: presentationFixture("single", "contact"),
  compactOut: presentationFixture("out", "contact"),
  lineDriveSingle: presentationFixture("single", "lineDrive"),
  balancedSingle: presentationFixture("single", "balanced")
};
verify("114. aggressive out／double 仍由 execution 描述提早攻擊，不借用 compact 語意", [attributionFixtures.aggressiveOut, attributionFixtures.aggressiveDouble].every(item => item.execution.includes("提早") && !item.execution.includes("縮短揮棒")));
verify("115. patient single／walk 只在 evidence 支援下描述選球", attributionFixtures.patientSingle.execution.includes("攻擊區") && attributionFixtures.patientSingle.execution.includes("才出棒") && attributionFixtures.patientWalk.execution.includes("連續放掉"));
verify("116. compactContact／compactLineDrive 才可擁有縮短揮棒語意", [attributionFixtures.compactSingle, attributionFixtures.compactOut, attributionFixtures.lineDriveSingle].every(item => item.execution.includes("縮短揮棒")));
verify("117. balanced single 使用中性 execution，不冒用 aggressive／patient／compact 語意", !/(提早|守住攻擊區|縮短揮棒)/.test(attributionFixtures.balancedSingle.execution));
verify("118. 相同 single 依 approach 產生不同 execution，但共用 canonical outcome", new Set([aggressiveSinglePresentation, attributionFixtures.patientSingle, attributionFixtures.compactSingle, attributionFixtures.balancedSingle].map(item => item.execution)).size === 4 && [aggressiveSinglePresentation, attributionFixtures.patientSingle, attributionFixtures.compactSingle, attributionFixtures.balancedSingle].every(item => item.outcome === "這個打席形成一壘安打"));

const resultSemanticMatrix = [
  ["single", "一壘安打"], ["double", "二壘安打"], ["triple", "三壘安打"], ["homeRun", "全壘打"],
  ["walk", "四壞保送"], ["strikeout", "三振"], ["out", "打者出局"], ["productiveOut", "具推進效果的打者出局"]
];
verify("119. Result semantic matrix 逐一呈現 canonical PA result", resultSemanticMatrix.every(([result, token]) => presentationFixture(result, result === "strikeout" ? "called" : "balanced").outcome.includes(token)));
verify("120. Outcome formatter 不反推 approach 或無證據 batted-ball detail", ["single", "double", "triple", "homeRun", "out", "productiveOut"].every(result => !/(縮短揮棒|提早出棒|守住好球帶|右前方|左中間|外野空檔|外野深處|打穿守備|滾地球|強勁|牆)/.test(presentationFixture(result, "aggressive").outcome)));
verify("121. aggressive + out 的合理 process 不因出局被改寫成錯誤決策", attributionFixtures.aggressiveOut.feedback.includes("攻擊選擇合理") && !attributionFixtures.aggressiveOut.feedback.includes("判斷錯誤"));
verify("122. aggressive + single save/reload 保留 approach、result 與三種 presentation", evaluate(`(() => {const s=__presentationState("single","aggressive");const c=__presentationChoice("aggressive");const present=x=>[x.approach,x.result,formatHighSchoolOffensiveExecutionText(c,x),formatHighSchoolOffensivePlayerFacingResult(c,x.result,__presentationMeaning(x.result),x).outcome,formatHighSchoolOffensiveCoachFeedback(c,x)];const loaded=OffensivePlateApproach.normalizePlateAppearanceState(JSON.parse(JSON.stringify(s)));return JSON.stringify(present(s))===JSON.stringify(present(loaded))&&loaded.approach==="aggressiveEarlySwing"&&loaded.result==="single";})()`));
verify("123. aggressive + single presentation 不消耗 RNG 且不修改 canonical state", evaluate(`(() => {const m=__opaMatch({seed:94701});const s=__presentationState("single","aggressive");const c=__presentationChoice("aggressive");const before=JSON.stringify({cursor:m.simulationCursor,state:s});formatHighSchoolOffensiveExecutionText(c,s);formatHighSchoolOffensivePlayerFacingResult(c,s.result,__presentationMeaning(s.result),s);formatHighSchoolOffensiveCoachFeedback(c,s);return before===JSON.stringify({cursor:m.simulationCursor,state:s});})()`));

console.log(`\nStructural audit：${JSON.stringify(audit)}`);
console.log(`\nOpportunity structural audit：${JSON.stringify(opportunityAudit)}`);
console.log(`\nPlayer agency structural audit：${JSON.stringify(agencyAudit)}`);
console.log(`\nCanonical PA accounting structural audit：${JSON.stringify(canonicalPAAudit)}`);
console.log(`\nOffensive feedback / outcome presentation audit：${JSON.stringify(presentationAudit)}`);
console.log(`\nOffensive Plate Approach Foundation v1：${passed}/${passed} 通過`);
