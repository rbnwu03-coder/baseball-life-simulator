const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
function makeContext() {
  const nodes=new Map(),storage=new Map(),timers=new Map();let timerId=0;
  const context=vm.createContext({console,document:{body:{classList:{add(){},remove(){},toggle(){},contains(){return false;}}},
    getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:"",textContent:"",value:"",style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},setAttribute(){},removeAttribute(){},querySelectorAll(){return [];}});return nodes.get(id);},querySelector(){return null;},querySelectorAll(){return [];}},
    localStorage:{setItem(k,v){storage.set(k,v);},getItem(k){return storage.get(k)||null;},removeItem(k){storage.delete(k);}},
    window:{setTimeout(callback,delay){timers.set(++timerId,{callback,delay});return timerId;},clearTimeout(id){timers.delete(id);}}});
  const files=[...fs.readFileSync(path.join(root,"index.html"),"utf8").matchAll(/<script src="([^"]+)"/g)].map(item=>item[1]).filter(file=>file!=="application-controller.js");
  files.forEach(file=>vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{filename:file}));
  const run=text=>vm.runInContext(text,context);
  run(`
    function careerFixture(position="游擊手",role="rotation",seed=77001) {
      stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
      player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
      player.name="Career fixture";
      applyCanonicalPositionProfile(player,position,[]);
      Object.keys(player.baseballSkills).forEach(key=>player.baseballSkills[key]=12);
      player.schoolInvitationState=createDefaultSchoolInvitationState();
      const set=generateSchoolInvitationSet(player,{generationSeed:"career-fixture-"+seed});
      finalizeSchoolInvitationSelection(player,set.invitations[0].schoolId);
      materializeSelectedHighSchoolRoster(player,{rosterRole:role==="starter"?"starter":"bench",playerPosition:TeamRosterFoundation.normalizePosition(position)});
      applyHighSchoolRoleState(role);
      player.highSchoolYearOneStartingRole="bench";
      player.highSchoolCompetitionEvaluation=HighSchoolCompetitionReassessment.createEvaluationState(getHighSchoolCompetitionEvaluationIdentity(player));
      initializeHighSchoolYearTransition(2);
      player.chapter="青棒第二年小結";
      enterCriticalYear();
      return player;
    }
    function playCareerMatchToEnd() {
      const match=player.highSchoolMatch;
      let ticks=0;
      while(!match.completed && ticks++<2500) {
        if(pendingYouthSeasonOutcome) continueYouthSeasonOutcome();
        if(isHighSchoolMatchDecisionVisible(match)) {
          const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
          if(!choice) throw new Error("No legal Y3 match decision");
          chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.62);
        } else advanceHighSchoolMatchPlaybackStep(match);
      }
      if(!match.completed) throw new Error("Y3 match did not complete: "+match.simulationPhase);
      showHighSchoolCompletedMatchOutcome(match);
      continueYouthSeasonOutcome();
      return ticks;
    }
    function finishCareerMatch(tier="strong",participated=true) {
      const match=player.highSchoolMatch;
      match.playerLineupStatus=participated?"substitute":"bench";
      match.playerEntryCompleted=participated;
      match.inning=7;match.half="終";match.scores={home:4,away:1};
      match.simulationLog=participated?[{sequence:1,type:"playerEntry",inning:4,half:"下"},{sequence:2,type:"plateAppearance",inning:5,half:"下",batterId:"player",result:tier==="strong"?"single":"out"}]:[];
      match.completedMoments=participated?[0,1,2].map(index=>({decision:"secure",tier,outcome:"正式處理",decisionQuality:tier==="strong"?"strong":"poor",executionQuality:tier==="strong"?"complete":"failed",scores:{...match.scores},runners:[],runnerChanges:[],scoringRunnerIds:[]})):[];
      match.playerContribution={strong:participated&&tier==="strong"?3:0,mixed:0,failure:participated&&tier!=="strong"?3:0,runsCreated:0,runsScored:0,hits:participated&&tier==="strong"?1:0,walks:0,outsCreated:0,errors:0};
      settleHighSchoolYearOneMatch(match,"secure");
      return match;
    }
  `);
  const flushTransitions=()=>{for(const [id,timer] of [...timers])if(timer.delay===420){timers.delete(id);timer.callback();}};
  return {context,run,json:expression=>JSON.parse(run(`JSON.stringify(${expression})`)),nodes,storage,flushTransitions};
}
module.exports={makeContext};
