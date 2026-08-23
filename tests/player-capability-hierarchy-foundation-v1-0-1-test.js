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
  "baseball-offense-prototype.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
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
          id, innerHTML: "", textContent: "", value: id === "batsSelect" || id === "throwsSelect" ? "R" : "Boundary 測試球員",
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
    window: { location: { search: "" }, setTimeout(callback) { callback(); return 1; }, clearTimeout() {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __boundaryRandom(seed) {
      let state = Math.max(1, Number(seed) >>> 0);
      return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    }
    function __boundaryPlayer(seed=1) {
      const target=createInitialPlayer("Boundary-"+seed);
      target.origin="understand";target.idealSelf="守備型";
      const roll=rollCharacterGenesis(__boundaryRandom(seed));
      const genesis=applyCharacterGenesis(target,{
        baseRoll:roll.baseRoll,
        allocation:{ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1},
        shape:roll.shape,bats:"R",throws:"R"
      });
      if(!genesis.ok) throw new Error(genesis.error);
      applyCanonicalPositionProfile(target,"內野手",[]);
      return target;
    }
    function __collectLegacyYouthMutationAudit() {
      const universal=new Set(UNIVERSAL_BASEBALL_SKILL_KEYS);
      const specialist=new Set(SPECIALIST_BASEBALL_SKILL_KEYS);
      const groups=[chapterOneEvents,chapterTwoEvents,youthSeasonEvents,positionCompetitionEvents,juniorBaseballEvents,juniorSeasonEvents];
      const records=[];
      function collectMutation(eventId,choiceIndex,path,effects,choice) {
        const writes=Object.entries(effects||{}).filter(([,delta])=>Number(delta)!==0).map(([skill,delta])=>({skill,delta:Number(delta)}));
        if(!writes.length)return;
        records.push({
          eventId,choiceIndex,path,writes,
          universalWrites:writes.filter(item=>universal.has(item.skill)).length,
          specialistWrites:writes.filter(item=>specialist.has(item.skill)).length,
          aboveOneWrites:writes.filter(item=>item.delta>1).length,
          multiSkill:writes.length>1,
          specialistWithoutExperience:writes.some(item=>specialist.has(item.skill))&&!choice.specialistExperienceDeltas
        });
      }
      groups.forEach(group=>Object.entries(group).forEach(([eventId,event])=>(event.choices||[]).forEach((choice,choiceIndex)=>{
        collectMutation(eventId,choiceIndex,"skillEffects",choice.skillEffects,choice);
        Object.entries(choice.positionSkillEffects||{}).forEach(([position,effects])=>collectMutation(eventId,choiceIndex,"positionSkillEffects."+position,effects,choice));
      })));
      youthGrounderThrowChoices.forEach((choice,choiceIndex)=>collectMutation("youth_match_grounder",choiceIndex,"integratedThrowChoice.skillEffects",choice.skillEffects,choice));
      const legacyEventIds=[...new Set(records.map(item=>item.eventId))].sort();
      const formalYouthV1Events=[];
      groups.forEach(group=>Object.entries(group).forEach(([eventId,event])=>(event.choices||[]).forEach(choice=>{
        if(choice.youthEventOutcome||choice.sourceContract===YOUTH_OUTCOME_V1_SOURCE_CONTRACT) formalYouthV1Events.push(eventId);
      })));
      return {
        legacyYouthEventCount:legacyEventIds.length,
        legacyYouthEventIds:legacyEventIds,
        mutationRecordCount:records.length,
        universalMutationCount:records.reduce((sum,item)=>sum+item.universalWrites,0),
        specialistMutationCount:records.reduce((sum,item)=>sum+item.specialistWrites,0),
        aboveOneCaseCount:records.filter(item=>item.aboveOneWrites>0).length,
        aboveOneMutationCount:records.reduce((sum,item)=>sum+item.aboveOneWrites,0),
        multiSkillCaseCount:records.filter(item=>item.multiSkill).length,
        specialistWithoutExperienceCaseCount:records.filter(item=>item.specialistWithoutExperience).length,
        formalYouthV1EventCount:new Set(formalYouthV1Events).size,
        formalYouthV1EventIds:[...new Set(formalYouthV1Events)].sort(),
        records
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

verify("1. Legacy 與 Youth v1 source contract 使用不同明確值", evaluate(`CAPABILITY_MUTATION_SOURCE_TYPES.LEGACY_YOUTH==="legacy-youth-skill-effect"&&CAPABILITY_MUTATION_SOURCE_TYPES.YOUTH_OUTCOME_V1==="youth-event-outcome-v1"&&LEGACY_YOUTH_SOURCE_CONTRACT!==YOUTH_OUTCOME_V1_SOURCE_CONTRACT`));
verify("2. 正式 Youth v1 normal +1 合法且 ledger 明確標 v1", evaluate(`(() => {const p=__boundaryPlayer(601);const r=applyYouthEventOutcome(p,{eventId:"v1-normal",choiceId:"one",skillDeltas:{catching:1}});return r.ok&&p.capabilityState.provenance.capabilityLedger.at(-1).sourceType==="youth-event-outcome-v1";})()`));
verify("3. 正式 Youth v1 normal +2 invalid", evaluate(`!applyYouthEventOutcome(__boundaryPlayer(602),{eventId:"v1-bad",choiceId:"plus-two",skillDeltas:{catching:2}}).ok`));
verify("4. 正式 Youth v1 普通事件多個 major skill invalid", evaluate(`!applyYouthEventOutcome(__boundaryPlayer(603),{eventId:"v1-bad",choiceId:"many",skillDeltas:{catching:1,throwing:1}}).ok`));
verify("5. 正式 Youth v1 milestone 兩個 +1 合法", evaluate(`applyYouthEventOutcome(__boundaryPlayer(604),{eventId:"v1-milestone",choiceId:"two",milestone:true,skillDeltas:{catching:1,throwing:1}}).ok`));
verify("6. 正式 Youth v1 milestone 超過兩項 invalid", evaluate(`!applyYouthEventOutcome(__boundaryPlayer(605),{eventId:"v1-milestone",choiceId:"three",milestone:true,skillDeltas:{catching:1,throwing:1,reaction:1}}).ok`));

for (const [index, skill] of ["blocking", "gameCalling", "control", "pitchStamina"].entries()) {
  verify(`${7 + index}. v1 ${skill} 不得跳過 experience 直接啟動`, evaluate(`!applyYouthEventOutcome(__boundaryPlayer(${610 + index}),{eventId:"v1-specialist",choiceId:${JSON.stringify(skill)},skillDeltas:{${skill}:1}}).ok`));
}
verify("11. catcher experience 先建立後可啟動 blocking／gameCalling 並保存 v1 outcome", evaluate(`(() => {const p=__boundaryPlayer(615);const r=applyYouthEventOutcome(p,{eventId:"catcher-reps",choiceId:"activate",specialistExperienceDeltas:{catcher:1}});return r.ok&&p.capabilityState.specialistExperience.catcher===1&&p.baseballSkills.blocking===1&&p.baseballSkills.gameCalling===1&&p.capabilityState.provenance.capabilityLedger.filter(x=>x.sourceType==="specialist-activation").length===2&&p.capabilityState.youthOutcomes.at(-1).sourceType==="youth-event-outcome-v1";})()`));
verify("12. pitcher experience 先建立後可啟動 control／pitchStamina", evaluate(`(() => {const p=__boundaryPlayer(616);const r=applyYouthEventOutcome(p,{eventId:"pitcher-reps",choiceId:"activate",specialistExperienceDeltas:{pitcher:1}});return r.ok&&p.capabilityState.specialistExperience.pitcher===1&&p.baseballSkills.control===1&&p.baseballSkills.pitchStamina===1;})()`));
verify("13. Unknown pre-HS mutation source 在改值前 fail loudly", evaluate(`(() => {player=__boundaryPlayer(620);const before=player.baseballSkills.catching;try{applySkillEffects({catching:1});return false}catch(error){return /unknown 不得默認為 legacy/.test(error.message)&&player.baseballSkills.catching===before;}})()`));
verify("14. Generic applySkillEffects 無法偽裝成正式 Youth v1 entry point", evaluate(`(() => {player=__boundaryPlayer(621);try{applySkillEffects({catching:1},{sourceType:"youth-event-outcome-v1",sourceContract:"youth-event-outcome-v1"});return false}catch(error){return /不得使用 generic applySkillEffects/.test(error.message);}})()`));
verify("15. 真實舊少棒 story event 仍可執行並標 legacy source", evaluate(`(() => {loadTestBookmark("chapter2");const before=player.baseballSkills.catching;choose("chapter2_intro",0);const ledger=player.capabilityState.provenance.capabilityLedger;return player.baseballSkills.catching===before+1&&ledger.some(x=>x.eventId==="chapter2_intro"&&x.sourceType==="legacy-youth-skill-effect"&&x.sourceContract===LEGACY_YOUTH_SOURCE_CONTRACT);})()`));
verify("16. Legacy story provenance 不會被誤標為 Youth v1", evaluate(`player.capabilityState.provenance.capabilityLedger.filter(x=>x.eventId==="chapter2_intro").every(x=>x.sourceType!=="youth-event-outcome-v1")`));

verify("17. Settlement 接受 legacy specialist finalized value 且不重算 history", evaluate(`(() => {const p=__boundaryPlayer(630);const source={sourceType:"legacy-youth-skill-effect",sourceContract:LEGACY_YOUTH_SOURCE_CONTRACT,eventId:"legacy-catcher",choiceId:"old"};player=p;applySkillEffects({blocking:2,gameCalling:1},source);const before=JSON.stringify(p.baseballSkills);const r=settleHighSchoolEntryCapability(p,{originType:"normal-youth-outcomes"});return r.ok&&before===JSON.stringify(p.baseballSkills)&&p.capabilityState.specialistExperience.catcher===1;})()`));
verify("18. Legacy specialist 補 experience 明確記為 legacy-normalization", evaluate(`player.capabilityState.provenance.normalizations.length===1&&player.capabilityState.provenance.normalizations[0].sourceType==="legacy-normalization"`));
verify("19. Repeated settlement 不會 double normalize", evaluate(`(() => {const before=JSON.stringify(player.capabilityState.provenance.normalizations);const r=settleHighSchoolEntryCapability(player);return r.ok&&r.existing&&before===JSON.stringify(player.capabilityState.provenance.normalizations);})()`));
verify("20. Reload 不會 double normalize 或造成 skill drift", evaluate(`(() => {const before=JSON.stringify([player.baseballSkills,player.capabilityState.provenance.normalizations]);const restored=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify([restored.baseballSkills,restored.capabilityState.provenance.normalizations]);})()`));

verify("21. Debug Snapshot 依 canonical order 顯示 initial／legacy／v1", evaluate(`(() => {const p=__boundaryPlayer(640);player=p;applySkillEffects({catching:1},{sourceType:"legacy-youth-skill-effect",sourceContract:LEGACY_YOUTH_SOURCE_CONTRACT,eventId:"legacy",choiceId:"one"});applyYouthEventOutcome(p,{eventId:"formal",choiceId:"one",skillDeltas:{catching:1}});const sources=getDebugCapabilitySnapshot(p).skillProvenance.catching.sources.map(x=>x.sourceType);return JSON.stringify(sources.slice(0,3))===JSON.stringify(["initial-formula","legacy-youth-skill-effect","youth-event-outcome-v1"]);})()`));
verify("22. Debug Snapshot 顯示 specialist activation 與 read-only legacy normalization", evaluate(`(() => {const activation=__boundaryPlayer(641);applyYouthEventOutcome(activation,{eventId:"catcher",choiceId:"xp",specialistExperienceDeltas:{catcher:1}});const a=getDebugCapabilitySnapshot(activation).skillProvenance.blocking.sources.some(x=>x.sourceType==="specialist-activation");const legacy=__boundaryPlayer(642);player=legacy;applySkillEffects({control:2},{sourceType:"legacy-youth-skill-effect",sourceContract:LEGACY_YOUTH_SOURCE_CONTRACT,eventId:"old-pitch",choiceId:"one"});settleHighSchoolEntryCapability(legacy);const n=getDebugCapabilitySnapshot(legacy).skillProvenance.control.sources.find(x=>x.sourceType==="legacy-normalization");return a&&n&&Object.isFrozen(n)&&Object.isFrozen(n.skills);})()`));
verify("23. Direct Start synthetic outcomes 全部標 Youth v1 且沒有 legacy provenance", evaluate(`(() => {const p=__boundaryPlayer(650);applyHighSchoolDirectStartHistory(p);const ledger=p.capabilityState.provenance.capabilityLedger;return p.capabilityState.youthOutcomes.length===4&&p.capabilityState.youthOutcomes.every(x=>x.sourceType==="youth-event-outcome-v1")&&ledger.every(x=>x.sourceType!=="legacy-youth-skill-effect");})()`));
verify("24. Direct Start reload 完全 identical 且不 reroll", evaluate(`(() => {const p=__boundaryPlayer(651);applyHighSchoolDirectStartHistory(p);settleHighSchoolEntryCapability(p,{originType:"synthetic-youth-origin-v1"});const before=JSON.stringify(getDebugCapabilitySnapshot(p));const restored=normalizeSave(JSON.parse(JSON.stringify(p)));return before===JSON.stringify(getDebugCapabilitySnapshot(restored));})()`));

const audit = parse(`__collectLegacyYouthMutationAudit()`);
verify("25. Read-only audit 找到明確 legacy youth capability writes", audit.legacyYouthEventCount > 0 && audit.mutationRecordCount > 0);
verify("26. Audit 同時涵蓋 Universal／Specialist／>+1／multi-skill／缺 experience", audit.universalMutationCount > 0 && audit.specialistMutationCount > 0 && audit.aboveOneCaseCount > 0 && audit.multiSkillCaseCount > 0 && audit.specialistWithoutExperienceCaseCount > 0);
verify("27. 現有 story content 沒有把 legacy skillEffects 假冒為正式 Youth v1 event", audit.formalYouthV1EventCount === 0);
verify("28. Audit 執行不修改 runtime player", evaluate(`(() => {const before=JSON.stringify(player);__collectLegacyYouthMutationAudit();return before===JSON.stringify(player);})()`));

console.log(`\nPlayer Capability Hierarchy Foundation v1.0.1：${passed}/${passed} 通過`);
console.log(`LEGACY_YOUTH_MUTATION_AUDIT_JSON=${JSON.stringify(audit)}`);
