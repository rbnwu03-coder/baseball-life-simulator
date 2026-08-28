const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "career-spine-contract.js", "career-transition-resolver.js", "career-transition-commit.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const context = vm.createContext({
    console: { log() {}, warn() {}, error: console.error },
    module: { exports: {} }, URLSearchParams,
    navigator: { clipboard: { async writeText() {} } },
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {} },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {
          id, innerHTML: "", textContent: "", value: id === "batsSelect" || id === "throwsSelect" ? "R" : "能力測試球員",
          style: {}, dataset: {}, disabled: false,
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
          focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
        });
        return nodes.get(id);
      },
      querySelector() { return null; }, querySelectorAll() { return []; },
      createElement() { return { value: "", style: {}, setAttribute() {}, select() {}, remove() {} }; }, execCommand() { return true; }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { location: { search: "" }, setTimeout() { return 1; }, clearTimeout() {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __capRandom(seed) {
      let state = Math.max(1, Number(seed) >>> 0);
      return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    }
    const __defaultAllocation = {ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1};
    function __capPlayer(idealSelf="全能型", seed=1, allocation=__defaultAllocation, originType="direct") {
      const target=createInitialPlayer("Capability 同一角色-"+seed);
      target.origin="understand";target.idealSelf=idealSelf;
      const roll=rollCharacterGenesis(__capRandom(seed));
      const genesis=applyCharacterGenesis(target,{baseRoll:roll.baseRoll,allocation,shape:roll.shape,bats:"R",throws:"R"});
      if(!genesis.ok) throw new Error(genesis.error);
      applyCanonicalPositionProfile(target,"內野手",[]);
      if(originType==="direct") applyHighSchoolDirectStartHistory(target);
      else {
        [
          {eventId:"fixture-youth-catch",choiceId:"basic-reps",skillDeltas:{catching:1},positionExperienceDeltas:{"內野手":1}},
          {eventId:"fixture-youth-reaction",choiceId:"first-step",skillDeltas:{reaction:1},positionExperienceDeltas:{"內野手":1}},
          {eventId:"fixture-junior-range",choiceId:"route-work",skillDeltas:{range:1},positionExperienceDeltas:{"內野手":1}},
          {eventId:"fixture-junior-iq",choiceId:"review-assignment",skillDeltas:{baseballIQ:1},identitySeeds:["reads-the-field"]}
        ].forEach((outcome,index)=>applyYouthEventOutcome(target,{...outcome,provenance:"normal-narrative-equivalent-fixture",resolvedSeed:seed+"-n-"+index}));
      }
      const settled=settleHighSchoolEntryCapability(target,{originType:originType==="direct"?"synthetic-youth-origin-v1":"normal-narrative-equivalent-fixture"});
      if(!settled.ok) throw new Error(settled.error);
      Object.assign(target,{chapter:"青棒",age:16,highSchoolStep:5,highSchoolRoleCode:"bench",highSchoolTeamRole:"發展／板凳任務"});
      return target;
    }
    function __capFinishMatch(seed, profile="ordinary") {
      stopHighSchoolMatchPlayback("capability-audit-reset");pendingYouthSeasonOutcome=null;isTransitioning=false;
      player=createRepresentativeHighSchoolEntryFixture(profile,seed);
      player.highSchoolRoleCode="bench";player.highSchoolTeamRole="發展／板凳任務";
      pendingHighSchoolMatchPositionOverride="二壘手";pendingHighSchoolMatchSimulationSeed=seed;
      setHighSchoolMatchOpportunityDebugEnabled(true);
      const match=prepareHighSchoolYearOneMatch();let steps=0;let decisions=0;
      while(!match.completed&&steps++<5000){
        if(isHighSchoolMatchDecisionVisible(match)){
          const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];
          if(!choice||!resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>.82)) throw new Error("capability opportunity decision stalled");
          decisions+=1;
        }else if(!advanceHighSchoolMatchPlaybackStep(match)) throw new Error("capability opportunity playback stalled");
      }
      if(!match.completed) throw new Error("capability opportunity match did not complete");
      const trace=JSON.parse(exportHighSchoolMatchOpportunityDebug(match));
      const defense=trace.opportunities.filter(item=>item.domain==="defense");
      return {
        completed:match.completed,decisions,
        defensiveResponsibilityCount:defense.filter(item=>item.responsibilityCheck).length,
        viableRouteCount:defense.reduce((sum,item)=>sum+item.viableRoutes.length,0),
        legalRouteCount:defense.reduce((sum,item)=>sum+item.legalRoutes.length,0),
        multiRouteCount:defense.filter(item=>item.viableRoutes.length>=2).length,
        meaningfulDecisionCount:defense.filter(item=>item.defensiveDecisionCreated).length,
        expiredRouteCount:defense.reduce((sum,item)=>sum+Math.max(0,item.legalRoutes.length-item.viableRoutes.length),0),
        zeroDefenseAction:!defense.some(item=>item.defensiveDecisionCreated)
      };
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

verify("1. Formula 與 settlement version 使用正式 v1 contract", evaluate(`INITIAL_SKILL_FORMULA_VERSION==="initial-skills-v1"&&HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION==="hs-entry-capability-v1"`));
verify("2. Initial Skill Formula 讀取完成三點 allocation 後的 Genesis", evaluate(`(() => {const p=__capPlayer("全能型",51001,{ballSense:2,observe:0,fitness:0,batting:1,baseRunning:0,baseballIQ:0},"narrative");return p.characterGenesis.finalAbilities.ballSense===p.characterGenesis.baseRoll.ballSense+2&&p.capabilityState.provenance.initialSkills.catching.contributions.find(x=>x.trait==="ballSense").traitValue===p.characterGenesis.finalAbilities.ballSense;})()`));
verify("3. 相同 roll 的不同合法 allocation 會產生不同 Initial Skills", evaluate(`(() => {const a=__capPlayer("全能型",51002,{ballSense:2,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:0},"narrative");const b=__capPlayer("全能型",51002,{ballSense:0,observe:0,fitness:0,batting:2,baseRunning:1,baseballIQ:0},"narrative");return JSON.stringify(a.characterGenesis.baseRoll)===JSON.stringify(b.characterGenesis.baseRoll)&&JSON.stringify(a.capabilityState.initialBaseballSkills)!==JSON.stringify(b.capabilityState.initialBaseballSkills);})()`));
verify("4. Same seed＋Genesis＋Ideal Self 產生相同 Initial Skills", evaluate(`JSON.stringify(__capPlayer("技巧型",51003).capabilityState.initialBaseballSkills)===JSON.stringify(__capPlayer("技巧型",51003).capabilityState.initialBaseballSkills)`));
verify("5. Character Variation skill-specific 且保持 -0.5～+0.5", evaluate(`(() => {const t=__capPlayer("全能型",51004).capabilityState.provenance.initialSkills;const v=Object.values(t).map(x=>x.variation);return new Set(v).size===8&&v.every(x=>x>=-.5&&x<=.5);})()`));
verify("6. Initial universal skills 全部落在 provisional 1–7", evaluate(`UNIVERSAL_BASEBALL_SKILL_KEYS.every(k=>{const v=__capPlayer("全能型",51005).capabilityState.initialBaseballSkills[k];return v>=1&&v<=7;})`));
verify("7. 無專項經驗時四項 specialist 明確為 0", evaluate(`SPECIALIST_BASEBALL_SKILL_KEYS.every(k=>__capPlayer("守備型",51006).baseballSkills[k]===0)`));
verify("8. Ideal Self Starting Bias 記錄於 target skills，而非改 Genesis", evaluate(`(() => {const d=__capPlayer("守備型",51007),b=__capPlayer("強打型",51007);return JSON.stringify(getFinalizedGenesisAbilities(d))===JSON.stringify(getFinalizedGenesisAbilities(b))&&d.capabilityState.provenance.initialSkills.catching.idealSelfBias===.5&&b.capabilityState.provenance.initialSkills.batting.idealSelfBias===.5;})()`));
verify("9. 全能型沒有任何單項 +0.5 Starting Bias", evaluate(`Math.max(...Object.values(IDEAL_SELF_STARTING_BIASES["全能型"]))===.25`));
verify("10. Specialist 不會因 Ideal Self 自動啟動", evaluate(`["全能型","強打型","技巧型","守備型","速度型","棒球理解型"].every(i=>SPECIALIST_BASEBALL_SKILL_KEYS.every(k=>__capPlayer(i,51008).baseballSkills[k]===0))`));
verify("11. 正式 catcher experience 可把 specialist 0 建立為 trained value", evaluate(`(() => {const p=__capPlayer("守備型",51009);const r=establishSpecialistExperience(p,{type:"catcher",eventId:"catcher-reps",choiceId:"activate"});return r.ok&&p.baseballSkills.blocking===1&&p.baseballSkills.gameCalling===1&&p.capabilityState.specialistExperience.catcher===1;})()`));
verify("12. Specialist missing 與合法 0 可由 validation 區分", evaluate(`(() => {const p=__capPlayer("全能型",51010);const zero=validateHighSchoolEntryCapability(p).ok;delete p.baseballSkills.blocking;return zero&&!validateHighSchoolEntryCapability(p).ok;})()`));
verify("13. 普通 Youth outcome 超過一個 skill effect 會拒絕", evaluate(`!applyYouthEventOutcome(__capPlayer("全能型",51011),{eventId:"bad",choiceId:"too-many",skillDeltas:{catching:1,throwing:1}}).ok`));
verify("13a. Specialist skill 不能繞過 experience activation 直接增加", evaluate(`!applyYouthEventOutcome(__capPlayer("全能型",510111),{eventId:"bad-specialist",choiceId:"free-blocking",skillDeltas:{blocking:1}}).ok`));
verify("14. 同一 Youth outcome 不會重複套用", evaluate(`(() => {const p=__capPlayer("全能型",51012);const o={eventId:"repeat",choiceId:"same",skillDeltas:{range:1},resolvedSeed:1};const before=p.baseballSkills.range;const a=applyYouthEventOutcome(p,o),b=applyYouthEventOutcome(p,o);return a.ok&&!a.duplicate&&b.duplicate&&p.baseballSkills.range===before+1;})()`));
verify("15. Youth provenance 保存 source event／choice／seed", evaluate(`(() => {const p=__capPlayer("全能型",51013);applyYouthEventOutcome(p,{eventId:"source-event",choiceId:"source-choice",skillDeltas:{range:1},resolvedSeed:77,provenance:"test"});const x=p.capabilityState.provenance.capabilityLedger.at(-1);return x.eventId==="source-event"&&x.choiceId==="source-choice"&&x.resolvedSeed===77;})()`));
verify("16. Position Experience 與 Baseball Skill 分開保存", evaluate(`(() => {const p=__capPlayer("全能型",51014);const before=p.baseballSkills.catching;applyYouthEventOutcome(p,{eventId:"position-only",choiceId:"2b",positionExperienceDeltas:{"二壘手":2}});return p.capabilityState.positionExperience["二壘手"]===2&&p.baseballSkills.catching===before;})()`));
verify("17. HS Entry Settlement 第二次呼叫完全 idempotent", evaluate(`(() => {const p=__capPlayer("全能型",51015);const before=JSON.stringify([p.baseballSkills,p.capabilityState.youthOutcomes,p.capabilityState.provenance]);const r=settleHighSchoolEntryCapability(p);return r.ok&&r.existing&&before===JSON.stringify([p.baseballSkills,p.capabilityState.youthOutcomes,p.capabilityState.provenance]);})()`));
verify("18. Settlement 後 missing universal validation 直接失敗", evaluate(`(() => {const p=__capPlayer("全能型",51016);delete p.baseballSkills.range;return !validateHighSchoolEntryCapability(p).ok;})()`));
verify("19. 未初始化玩家無法無聲進入正式高中 Match", evaluate(`(() => {player=createInitialPlayer("invalid");try{prepareHighSchoolYearOneMatch();return false}catch(e){return e.message.includes("拒絕未完成 Capability Settlement");}})()`));
verify("20. 合法 settlement 玩家可正常建立正式高中 Match", evaluate(`(() => {player=__capPlayer("全能型",51017);pendingHighSchoolMatchSimulationSeed=51017;return prepareHighSchoolYearOneMatch().id==="hs-y1-autumn-exhibition";})()`));
verify("21. Direct Start 使用 synthetic outcome 後進入同一 settlement", evaluate(`(() => {const p=__capPlayer("守備型",51018,__defaultAllocation,"direct");return p.capabilityState.originType==="synthetic-youth-origin-v1"&&p.capabilityState.youthOutcomes.length===4&&validateHighSchoolEntryCapability(p).ok;})()`));
verify("22. Narrative-equivalent fixture 使用相同 formula／settlement／validation", evaluate(`(() => {const d=__capPlayer("守備型",51019,__defaultAllocation,"direct"),n=__capPlayer("守備型",51019,__defaultAllocation,"narrative");return d.capabilityState.initialSkillFormulaVersion===n.capabilityState.initialSkillFormulaVersion&&d.capabilityState.settlementVersion===n.capabilityState.settlementVersion&&validateHighSchoolEntryCapability(d).ok&&validateHighSchoolEntryCapability(n).ok;})()`));
verify("23. 新 save reload 後 capability truth 完全不變", evaluate(`(() => {player=__capPlayer("技巧型",51020);const before=JSON.stringify(getDebugCapabilitySnapshot(player));const restored=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify(getDebugCapabilitySnapshot(restored));})()`));
verify("24. Reload 不重產 Character Variation", evaluate(`(() => {player=__capPlayer("技巧型",51021);const before=JSON.stringify(player.capabilityState.provenance.initialSkills);player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify(player.capabilityState.provenance.initialSkills);})()`));
verify("25. Direct Start reload 不重套 synthetic youth outcomes", evaluate(`(() => {player=__capPlayer("守備型",51022);const before=JSON.stringify([player.baseballSkills,player.capabilityState.youthOutcomes]);player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify([player.baseballSkills,player.capabilityState.youthOutcomes]);})()`));
verify("26. 舊高中 save deterministic migration 產生合法 capability", evaluate(`(() => {const legacy={saveVersion:14,name:"Legacy",age:16,chapter:"青棒",idealSelf:"守備型",baseballSkills:{batting:4,baseRunning:3,baseballIQ:3}};const a=normalizeSave(JSON.parse(JSON.stringify(legacy))),b=normalizeSave(JSON.parse(JSON.stringify(legacy)));return validateHighSchoolEntryCapability(a).ok&&JSON.stringify(getDebugCapabilitySnapshot(a))===JSON.stringify(getDebugCapabilitySnapshot(b));})()`));
verify("27. Repeated migration／load 不造成 stat drift", evaluate(`(() => {let p=normalizeSave({saveVersion:14,name:"Legacy Drift",age:16,chapter:"青棒",idealSelf:"全能型"});const before=JSON.stringify(p.baseballSkills);p=normalizeSave(JSON.parse(JSON.stringify(p)));p=normalizeSave(JSON.parse(JSON.stringify(p)));return before===JSON.stringify(p.baseballSkills);})()`));
verify("28. Migration 不消耗 Math.random 或 Match RNG", evaluate(`(() => {let calls=0;const original=Math.random;Math.random=()=>{calls+=1;return .5};normalizeSave({saveVersion:14,name:"Legacy RNG",age:16,chapter:"青棒",idealSelf:"全能型"});Math.random=original;return calls===0;})()`));
verify("29. Debug Snapshot 完整輸出 Genesis／Ideal／Initial／Youth／Final／Experience／Version／Provenance", evaluate(`(() => {const s=getDebugCapabilitySnapshot(__capPlayer("守備型",51023));return ["genesis","idealSelf","initialSkills","youthDeltas","finalHighSchoolEntrySkills","positionExperience","specialistExperience","initialSkillFormulaVersion","settlementVersion","provenanceSummary"].every(k=>Object.hasOwn(s,k));})()`));
verify("30. Debug Snapshot 是 read-only 且不 mutation player", evaluate(`(() => {const p=__capPlayer("守備型",51024);const before=JSON.stringify(p);const s=getDebugCapabilitySnapshot(p);return Object.isFrozen(s)&&before===JSON.stringify(p);})()`));
verify("31. 四種 representative high-school-entry profiles 全部合法", evaluate(`["ordinary","defense","batting","low"].every((profile,index)=>validateHighSchoolEntryCapability(createRepresentativeHighSchoolEntryFixture(profile,51030+index)).ok)`));
verify("32. 守備偏向與打擊偏向 fixture 具有目標差異", evaluate(`(() => {const d=createRepresentativeHighSchoolEntryFixture("defense",51034),b=createRepresentativeHighSchoolEntryFixture("batting",51034);return d.baseballSkills.catching>=b.baseballSkills.catching&&d.baseballSkills.reaction>=b.baseballSkills.reaction&&b.baseballSkills.batting>d.baseballSkills.batting;})()`));
verify("33. 低能力 fixture 仍符合 universal >=1 與 specialist >=0", evaluate(`(() => {const p=createRepresentativeHighSchoolEntryFixture("low",51035);return UNIVERSAL_BASEBALL_SKILL_KEYS.every(k=>p.baseballSkills[k]>=1)&&SPECIALIST_BASEBALL_SKILL_KEYS.every(k=>p.baseballSkills[k]>=0);})()`));

const ideals = ["全能型", "強打型", "技巧型", "守備型", "速度型", "棒球理解型"];
const auditSeeds = Array.from({ length: 100 }, (_, index) => 511000 + index);
const directAudit = auditSeeds.map((seed, index) => parse(`getDebugCapabilitySnapshot(__capPlayer(${JSON.stringify(ideals[index % ideals.length])},${seed},__defaultAllocation,"direct"))`));
const narrativeAudit = auditSeeds.map((seed, index) => parse(`getDebugCapabilitySnapshot(__capPlayer(${JSON.stringify(ideals[index % ideals.length])},${seed},__defaultAllocation,"narrative"))`));
const universalValues = snapshots => snapshots.flatMap(item => Object.values(item.finalHighSchoolEntrySkills).slice(0, 8));
const specialistValues = snapshots => snapshots.flatMap(item => Object.values(item.finalHighSchoolEntrySkills).slice(8));
const distribution = values => ({ min: Math.min(...values), max: Math.max(...values), mean: values.reduce((a, b) => a + b, 0) / values.length });
const distributionsBySkill = snapshots => Object.fromEntries([
  "catching", "throwing", "batting", "baseRunning", "baseballIQ", "armStrength", "reaction", "range"
].map(skill => [skill, distribution(snapshots.map(item => item.finalHighSchoolEntrySkills[skill]))]));
verify("34. Direct Start 100/100 完成 settlement", directAudit.every(item => item.initialized && item.settlementVersion === "hs-entry-capability-v1"));
verify("35. Direct／Narrative-equivalent universal skill 0 count 都是 0", [...universalValues(directAudit), ...universalValues(narrativeAudit)].every(value => value >= 1));
verify("36. 無 specialist experience 的 100 人 audit 保持四項 specialist 0", [...specialistValues(directAudit), ...specialistValues(narrativeAudit)].every(value => value === 0));
verify("37. 六個 Ideal Self 在同 seed comparison 有小幅 target differentiation", evaluate(`(() => {const seed=511999;const all=["全能型","強打型","技巧型","守備型","速度型","棒球理解型"].map(i=>__capPlayer(i,seed,__defaultAllocation,"narrative"));return new Set(all.map(p=>JSON.stringify(p.capabilityState.initialBaseballSkills))).size>1&&Math.max(...all.flatMap(p=>UNIVERSAL_BASEBALL_SKILL_KEYS.map(k=>p.baseballSkills[k])))-Math.min(...all.flatMap(p=>UNIVERSAL_BASEBALL_SKILL_KEYS.map(k=>p.baseballSkills[k])))<=5;})()`));

const opportunity = parse(`Array.from({length:500},(_,index)=>__capFinishMatch(512000+index,["ordinary","defense","batting","low"][index%4]))`);
const opportunityTotals = opportunity.reduce((totals, match) => {
  for (const key of ["defensiveResponsibilityCount", "viableRouteCount", "legalRouteCount", "multiRouteCount", "meaningfulDecisionCount", "expiredRouteCount"]) totals[key] += match[key];
  totals.zeroDefenseGames += match.zeroDefenseAction ? 1 : 0;
  return totals;
}, { defensiveResponsibilityCount: 0, viableRouteCount: 0, legalRouteCount: 0, multiRouteCount: 0, meaningfulDecisionCount: 0, expiredRouteCount: 0, zeroDefenseGames: 0 });
opportunityTotals.viableRouteRate = opportunityTotals.legalRouteCount ? opportunityTotals.viableRouteCount / opportunityTotals.legalRouteCount : 0;
opportunityTotals.expiredRouteRate = opportunityTotals.legalRouteCount ? opportunityTotals.expiredRouteCount / opportunityTotals.legalRouteCount : 0;
verify("38. Representative 500/500 matches 完整終場", opportunity.every(match => match.completed));
verify("39. 2B Opportunity diagnostic 完整輸出 responsibility／viable／multi／meaningful／expired／zero-defense", ["defensiveResponsibilityCount", "viableRouteCount", "multiRouteCount", "meaningfulDecisionCount", "expiredRouteRate", "zeroDefenseGames"].every(key => Number.isFinite(opportunityTotals[key])));
verify("40. Representative capability 明顯降低舊 Direct fixture 的 80.192% expired", opportunityTotals.expiredRouteRate < 0.80192);
verify("41. Representative capability 明顯降低舊 Direct fixture 的 67% zero-defense", opportunityTotals.zeroDefenseGames / opportunity.length < 0.67);
verify("42. Match window threshold 完全未調整", evaluate(`classifyDefensiveExecutionWindow(1.74)==="expired"&&classifyDefensiveExecutionWindow(1.75)==="narrow"&&classifyDefensiveExecutionWindow(3.5)==="normal"&&classifyDefensiveExecutionWindow(5.5)==="wide"`));
verify("43. Repository 沒有新增 authoritative Overall Rating", !fs.readFileSync(path.join(root, "player.js"), "utf8").includes("overallRating"));

const audit = {
  schemaVersion: "player-capability-hierarchy-foundation-v1",
  formulaVersion: "initial-skills-v1",
  settlementVersion: "hs-entry-capability-v1",
  directStart: {
    characters: directAudit.length,
    settlementCompletionRate: directAudit.filter(item => item.initialized).length / directAudit.length,
    universal: distribution(universalValues(directAudit)),
    universalBySkill: distributionsBySkill(directAudit),
    universalZeroCount: universalValues(directAudit).filter(value => value === 0).length,
    specialistZeroCount: specialistValues(directAudit).filter(value => value === 0).length
  },
  normalNarrativeEquivalent: {
    disclosure: "合法 Youth Outcome fixture；不是完整少年篇真實 population distribution。",
    characters: narrativeAudit.length,
    universal: distribution(universalValues(narrativeAudit)),
    universalBySkill: distributionsBySkill(narrativeAudit),
    universalZeroCount: universalValues(narrativeAudit).filter(value => value === 0).length,
    specialistZeroCount: specialistValues(narrativeAudit).filter(value => value === 0).length
  },
  opportunity: { matches: opportunity.length, ...opportunityTotals },
  matchBalanceChanged: false
};

console.log(`\nPlayer Capability Hierarchy Foundation v1：${passed}/${passed} 通過`);
console.log(`CAPABILITY_FOUNDATION_AUDIT_JSON=${JSON.stringify(audit)}`);
