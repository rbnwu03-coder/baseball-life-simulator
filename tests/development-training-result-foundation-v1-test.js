const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const resolverSource = fs.readFileSync(path.join(root, "baseball-training-resolver.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
const context = vm.createContext({ console });
vm.runInContext(playerSource, context, { filename: "player.js" });

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function evaluate(expression) {
  return vm.runInContext(expression, context);
}

function parse(expression) {
  return JSON.parse(evaluate(`JSON.stringify(${expression})`));
}

evaluate(`
  function __makeDevPlayer(config = {}) {
    const target = createInitialPlayer(config.name || "Development Fixture");
    target.idealSelf = config.idealSelf || "全能型";
    target.bats = config.bats || "R";
    target.throws = config.throws || "R";
    target.ballSense = config.ballSense ?? 3;
    target.observe = config.observe ?? 3;
    target.fitness = config.fitness ?? 3;
    target.characterGenesis.completed = true;
    target.characterGenesis.finalAbilities = {
      ballSense: config.ballSense ?? 3,
      observe: config.observe ?? 3,
      fitness: config.fitness ?? 3,
      batting: config.battingTrait ?? 3,
      baseRunning: config.baseRunningTrait ?? 3,
      baseballIQ: config.baseballIQTrait ?? 3
    };
    DEVELOPMENT_SKILL_KEYS.forEach(skill => {
      target.baseballSkills[skill] = SPECIALIST_BASEBALL_SKILL_KEYS.includes(skill) ? 0 : (config.skill ?? 5);
    });
    if (config.targetSkill) target.baseballSkills[config.targetSkill] = config.skill ?? 5;
    target.capabilityState.characterSeed = config.characterSeed || "development-fixture-seed";
    target.capabilityState.initialized = true;
    target.capabilityState.initialSkillFormulaVersion = INITIAL_SKILL_FORMULA_VERSION;
    target.capabilityState.settlementVersion = HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION;
    return target;
  }
  function __devContext(id, overrides = {}) {
    return Object.assign({
      sourceId: id,
      sourceType: "training",
      targetSkill: "batting",
      activityType: "technical",
      difficulty: "appropriate",
      quality: "standard",
      playerChoice: "contact-focus",
      developmentBias: "ideal-self",
      metadata: {}
    }, overrides);
  }
`);

verify("1. Development 使用獨立 state／result version contract", evaluate(`DEVELOPMENT_STATE_VERSION === "development-v1" && DEVELOPMENT_RESULT_VERSION === "development-result-v1"`));
verify("2. Development State 初始化全部 12 項 skill progress", evaluate(`(() => { const p=__makeDevPlayer(); return Object.keys(p.developmentState.skillProgress).length===12 && DEVELOPMENT_SKILL_KEYS.every(skill=>p.developmentState.skillProgress[skill]===0); })()`));
verify("3. Progress state 不保存第二份 Current Skill truth", evaluate(`(() => { const state=__makeDevPlayer().developmentState; return !Object.prototype.hasOwnProperty.call(state,"baseballSkills") && !Object.prototype.hasOwnProperty.call(state,"currentSkills"); })()`));
verify("4. 新角色、Direct-style fixture 與 Debug fixture deterministic 初始化 progress 0", evaluate(`(() => { const a=createInitialPlayer("a"),b=createInitialPlayer("b"),c=createInitialPlayer("c"); return [a,b,c].every(p=>validateDevelopmentState(p).ok&&DEVELOPMENT_SKILL_KEYS.every(skill=>p.developmentState.skillProgress[skill]===0)); })()`));
verify("5. Context 缺必要欄位時 fail closed", evaluate(`!applyDevelopmentResult(__makeDevPlayer(), { sourceType:"training" }).ok`));
verify("6. 五種 source type 與六種 activity type 都有 stable contract", evaluate(`DEVELOPMENT_SOURCE_TYPES.length===5 && DEVELOPMENT_ACTIVITY_TYPES.length===6 && DEVELOPMENT_SOURCE_TYPES.includes("gameExperience") && DEVELOPMENT_ACTIVITY_TYPES.includes("specialist")`));

const deterministicA = parse(`(() => { const p=__makeDevPlayer(); return applyDevelopmentResult(p,__devContext("deterministic")); })()`);
const deterministicB = parse(`(() => { const p=__makeDevPlayer(); return applyDevelopmentResult(p,__devContext("deterministic")); })()`);
verify("7. Same player state＋context＋choice 得到相同 result", JSON.stringify(deterministicA) === JSON.stringify(deterministicB));
verify("8. Development variation 不呼叫 Math.random", evaluate(`(() => { const original=Math.random; Math.random=()=>{throw new Error("rng-used")}; try { return applyDevelopmentResult(__makeDevPlayer(),__devContext("no-random")).ok; } finally { Math.random=original; } })()`));
verify("9. Development 不讀寫 Match RNG state", evaluate(`(() => { const p=__makeDevPlayer(); p.matchRngState={seed:7788,cursor:31}; const before=JSON.stringify(p.matchRngState); applyDevelopmentResult(p,__devContext("rng-isolation")); return JSON.stringify(p.matchRngState)===before; })()`));

const traitAudit = parse(`(() => {
  const high=[],low=[];
  for(let i=0;i<100;i++){
    const id="trait-"+i;
    const a=__makeDevPlayer({ballSense:5,observe:5,baseballIQTrait:5,characterSeed:"same-"+i});
    const b=__makeDevPlayer({ballSense:1,observe:1,baseballIQTrait:1,characterSeed:"same-"+i});
    high.push(applyDevelopmentResult(a,__devContext(id)).result.progressGained);
    low.push(applyDevelopmentResult(b,__devContext(id)).result.progressGained);
  }
  return { highMean:high.reduce((s,v)=>s+v,0)/high.length, lowMean:low.reduce((s,v)=>s+v,0)/low.length };
})()`);
verify("10. Relevant Trait 高的 technical learner 平均進度較高", traitAudit.highMean > traitAudit.lowMean);
verify("11. 低 Trait 仍可取得正 progress，不形成 hard gate", traitAudit.lowMean > 0);

const skillAudit = parse(`(() => {
  const buckets={low:[],mid:[],elite:[]};
  for(let i=0;i<100;i++){
    for(const [key,skill] of [["low",3],["mid",10],["elite",17]]){
      const p=__makeDevPlayer({skill,characterSeed:"skill-"+i});
      buckets[key].push(applyDevelopmentResult(p,__devContext("skill-"+i)).result.progressGained);
    }
  }
  return Object.fromEntries(Object.entries(buckets).map(([key,values])=>[key,values.reduce((s,v)=>s+v,0)/values.length]));
})()`);
verify("12. Current Skill diminishing return 為 low > mid > elite", skillAudit.low > skillAudit.mid && skillAudit.mid > skillAudit.elite);
verify("13. Elite refinement 仍可能取得正 progress", skillAudit.elite > 0);

const biasAudit = parse(`(() => {
  const defense=__makeDevPlayer({idealSelf:"守備型",targetSkill:"reaction",skill:5,characterSeed:"bias-same"});
  const power=__makeDevPlayer({idealSelf:"強打型",targetSkill:"reaction",skill:5,characterSeed:"bias-same"});
  const ctx=__devContext("bias-defense",{targetSkill:"reaction",activityType:"recognition"});
  const defenseResult=applyDevelopmentResult(defense,ctx).result;
  const powerResult=applyDevelopmentResult(power,ctx).result;
  const defenseBat=__makeDevPlayer({idealSelf:"守備型",skill:5,characterSeed:"bias-bat"});
  const battingResult=applyDevelopmentResult(defenseBat,__devContext("bias-batting")).result;
  return {defense:defenseResult.progressGained,power:powerResult.progressGained,batting:battingResult.progressGained};
})()`);
verify("14. 守備 Ideal Self 對守備學習有小幅 Development Bias", biasAudit.defense > biasAudit.power);
verify("15. 守備 Ideal Self 仍可正常做 batting training", biasAudit.batting > 0);

const fitAudit = parse(`(() => {
  const result={};
  for(const difficulty of DEVELOPMENT_DIFFICULTIES){
    const p=__makeDevPlayer({skill:5,characterSeed:"fit-same"});
    result[difficulty]=applyDevelopmentResult(p,__devContext("fit",{difficulty})).result.progressGained;
  }
  return result;
})()`);
verify("16. Appropriate context 比 easy 與 overmatched 更有效率", fitAudit.appropriate > fitAudit.easy && fitAudit.appropriate > fitAudit.overmatched);
verify("17. Challenging 有 upside 但不是免費固定最高", fitAudit.challenging > fitAudit.overmatched && fitAudit.challenging <= fitAudit.appropriate + 3);
verify("18. Quality contract 能形成 elite > limited，但未接 School quality", evaluate(`(() => { const a=__makeDevPlayer({characterSeed:"quality"}),b=__makeDevPlayer({characterSeed:"quality"}); const elite=applyDevelopmentResult(a,__devContext("quality",{quality:"elite"})).result.progressGained; const limited=applyDevelopmentResult(b,__devContext("quality",{quality:"limited"})).result.progressGained; return elite>limited; })()`));
verify("19. metadata 中 School trainingQuality 不會偷偷改變結果", evaluate(`(() => { const a=__makeDevPlayer({characterSeed:"school-boundary"}),b=__makeDevPlayer({characterSeed:"school-boundary"}); const x=applyDevelopmentResult(a,__devContext("school-boundary",{metadata:{trainingQuality:"elite"}})).result.progressGained; const y=applyDevelopmentResult(b,__devContext("school-boundary",{metadata:{trainingQuality:"limited"}})).result.progressGained; return x===y; })()`));

verify("20. Progress settlement 可一次正確跨越多個門檻", evaluate(`(() => { const r=settleDevelopmentProgress(5,90,250); return r.skillAfter===8&&r.progressAfter===40&&r.levelUps===3; })()`));
verify("21. Skill 20 hard cap 且 progress 歸零", evaluate(`(() => { const p=__makeDevPlayer({skill:20}); p.developmentState.skillProgress.batting=88; const r=applyDevelopmentResult(p,__devContext("cap")); return r.result.skillAfter===20&&r.result.progressAfter===0&&r.result.progressGained===0&&r.result.skillCapReached; })()`));
verify("22. Skill 不可能成為 21", evaluate(`settleDevelopmentProgress(19,99,500).skillAfter===20`));
verify("23. 普通 generic training 不能啟動 blocking 0", evaluate(`(() => { const p=__makeDevPlayer({targetSkill:"blocking",skill:0}); const r=applyDevelopmentResult(p,__devContext("generic-specialist",{targetSkill:"blocking"})); return !r.ok&&r.errors.includes("specialist-activation-required")&&p.baseballSkills.blocking===0; })()`));
verify("24. Specialist context 沒有相關經驗仍拒絕", evaluate(`(() => { const p=__makeDevPlayer({targetSkill:"blocking",skill:0}); const r=applyDevelopmentResult(p,__devContext("no-exp",{targetSkill:"blocking",activityType:"specialist",metadata:{specialistEligible:true}})); return !r.ok; })()`));
verify("25. 合法 catcher experience 可開始累積 blocking progress", evaluate(`(() => { const p=__makeDevPlayer({targetSkill:"blocking",skill:0}); p.capabilityState.specialistExperience.catcher=1; const r=applyDevelopmentResult(p,__devContext("catcher-exp",{targetSkill:"blocking",activityType:"specialist",metadata:{specialistEligible:true}})); return r.ok&&r.result.progressGained>0&&p.baseballSkills.blocking===0&&p.developmentState.skillProgress.blocking>0; })()`));
verify("26. 合法 specialist progress 跨門檻後才能啟動 skill 1", evaluate(`(() => { const p=__makeDevPlayer({targetSkill:"blocking",skill:0}); p.capabilityState.specialistExperience.catcher=1; p.developmentState.skillProgress.blocking=95; const r=applyDevelopmentResult(p,__devContext("catcher-level",{targetSkill:"blocking",activityType:"specialist",metadata:{specialistEligible:true}})); return r.ok&&r.result.levelUps===1&&p.baseballSkills.blocking===1; })()`));

verify("27. Universal skill 可直接累積 progress", evaluate(`(() => { const p=__makeDevPlayer({targetSkill:"throwing",skill:4}); const r=applyDevelopmentResult(p,__devContext("universal",{targetSkill:"throwing",activityType:"repetition"})); return r.ok&&r.result.progressGained>0; })()`));
verify("28. 普通結果不降低 progress 或永久 skill", evaluate(`(() => { const p=__makeDevPlayer({skill:5}); p.developmentState.skillProgress.batting=60; const r=applyDevelopmentResult(p,__devContext("non-negative",{difficulty:"overmatched"})); return r.result.progressAfter>=60&&r.result.skillAfter>=5; })()`));

const idempotencyAudit = parse(`(() => {
  const p=__makeDevPlayer({skill:5});
  const ctx=__devContext("idempotent");
  const first=applyDevelopmentResult(p,ctx);
  const snapshot=JSON.stringify({skill:p.baseballSkills.batting,state:p.developmentState});
  const second=applyDevelopmentResult(p,ctx);
  return {first:first.status,second:second.status,unchanged:snapshot===JSON.stringify({skill:p.baseballSkills.batting,state:p.developmentState}),history:p.developmentState.history.length};
})()`);
verify("29. 相同 settlement ID 只套用一次", idempotencyAudit.first === "applied" && idempotencyAudit.second === "duplicate" && idempotencyAudit.unchanged && idempotencyAudit.history === 1);
verify("30. Progress 跨門檻會留下 Capability provenance", evaluate(`(() => { const p=__makeDevPlayer({skill:5}); p.developmentState.skillProgress.batting=95; const r=applyDevelopmentResult(p,__devContext("provenance")); const entry=p.capabilityState.provenance.capabilityLedger.at(-1); return r.result.levelUps===1&&entry.sourceType===CAPABILITY_MUTATION_SOURCE_TYPES.DEVELOPMENT&&entry.sourceContract===DEVELOPMENT_RESULT_VERSION&&entry.provenance==="development-progress-threshold"; })()`));
verify("31. Result ledger 保存 source、before／after、gain、reason 與 formula version", evaluate(`(() => { const p=__makeDevPlayer(); const r=applyDevelopmentResult(p,__devContext("ledger")); const h=p.developmentState.history[0]; return h.sourceId==="ledger"&&h.skillBefore===5&&h.skillAfter===5&&h.progressGained>0&&Array.isArray(h.reasons)&&h.formulaVersion===DEVELOPMENT_RESULT_VERSION; })()`));
verify("32. Debug Snapshot 顯示 progress、diagnostics、source 且 read-only", evaluate(`(() => { const p=__makeDevPlayer(); applyDevelopmentResult(p,__devContext("debug-snapshot")); const s=getDevelopmentDebugSnapshot(p); return Object.isFrozen(s)&&Object.isFrozen(s.skillProgress)&&Object.isFrozen(s.lastResult)&&s.lastResult.sourceId==="debug-snapshot"&&Number.isFinite(s.lastResult.diagnostics.variation); })()`));

verify("33. Missing-state migration 全 progress 0 且不改 existing Baseball Skills", evaluate(`(() => { const p=__makeDevPlayer({skill:9}); delete p.developmentState; const before=JSON.stringify(p.baseballSkills); const state=ensureDevelopmentStateShape(p,null,{migrateMissing:true,sourceSaveVersion:15}); return JSON.stringify(p.baseballSkills)===before&&DEVELOPMENT_SKILL_KEYS.every(skill=>state.skillProgress[skill]===0)&&state.migration.preservedBaseballSkills===true; })()`));
verify("34. Existing Development progress／history restore 不 drift", evaluate(`(() => { const p=__makeDevPlayer(); applyDevelopmentResult(p,__devContext("restore")); const saved=JSON.parse(JSON.stringify(p.developmentState)); const before=JSON.stringify(saved); p.developmentState=null; ensureDevelopmentStateShape(p,saved,{migrateMissing:true,sourceSaveVersion:15}); return JSON.stringify(p.developmentState)===before; })()`));
verify("35. Development migration 不改 School Invitation／selected school truth", evaluate(`(() => { const p=__makeDevPlayer(); p.schoolInvitationState={selectedSchoolId:"school-a",selectionFinalized:true,invitations:[{schoolId:"school-a"}]}; const before=JSON.stringify(p.schoolInvitationState); delete p.developmentState; ensureDevelopmentStateShape(p,null,{migrateMissing:true,sourceSaveVersion:15}); return JSON.stringify(p.schoolInvitationState)===before; })()`));
verify("36. Direct Start synthetic origin 本身不增加 Development progress", evaluate(`(() => { const p=__makeDevPlayer(); applySyntheticYouthOrigin(p); return DEVELOPMENT_SKILL_KEYS.every(skill=>p.developmentState.skillProgress[skill]===0)&&p.developmentState.history.length===0; })()`));
verify("37. Handedness 不提供免費 Development bonus", evaluate(`(() => { const r=__makeDevPlayer({bats:"R",throws:"R",characterSeed:"hands"}),l=__makeDevPlayer({bats:"L",throws:"L",characterSeed:"hands"}); return applyDevelopmentResult(r,__devContext("hands")).result.progressGained===applyDevelopmentResult(l,__devContext("hands")).result.progressGained; })()`));
verify("38. Position 名稱不會自動授予 skill 或 progress", evaluate(`(() => { const a=__makeDevPlayer({characterSeed:"position"}),b=__makeDevPlayer({characterSeed:"position"}); a.primaryPosition="內野手";b.primaryPosition="捕手"; const x=applyDevelopmentResult(a,__devContext("position")).result.progressGained,y=applyDevelopmentResult(b,__devContext("position")).result.progressGained; return x===y&&a.baseballSkills.catching===b.baseballSkills.catching; })()`));

verify("39. Formal Training Resolver 不再保存 direct baseball skillEffects", !/skillEffects\s*:/.test(resolverSource));
verify("40. Formal Training runtime 經 applyDevelopmentResult 而非 applySkillEffects", /applyDevelopmentResult\(player/.test(scriptSource)
  && !/function applyResolvedTrainingResult[\s\S]*?applySkillEffects\(/.test(scriptSource.match(/function applyResolvedTrainingResult[\s\S]*?function applyTrainingRelationshipHook/)?.[0] || ""));
verify("41. Legacy story skillEffects 仍保留，未被本 Sprint 全面改寫", /skillEffects\s*:/.test(storySource));
verify("42. School／Match／Coach future bridges 只存在 contract，沒有 automatic effect", /future-only-not-applied/.test(scriptSource) && !/trainingQuality\s*\*|playingTimeOpportunity\s*\*/.test(scriptSource));

const distribution = parse(`(() => {
  const gains=[];
  let levelUps=0, nan=0, negative=0, aboveCap=0, missingSource=0, missingProvenance=0, duplicates=0;
  const ideals=PlayerIdentityOptions.idealSelf;
  const activities=["technical","physical","recognition","decision","repetition"];
  const difficulties=DEVELOPMENT_DIFFICULTIES;
  const qualities=DEVELOPMENT_QUALITIES;
  const skills=UNIVERSAL_BASEBALL_SKILL_KEYS;
  for(let i=0;i<1000;i++){
    const targetSkill=skills[i%skills.length];
    const skill=1+(i%19);
    const p=__makeDevPlayer({
      idealSelf:ideals[i%ideals.length],targetSkill,skill,
      ballSense:1+(i%5),observe:1+((i*3)%5),fitness:1+((i*7)%5),
      battingTrait:1+((i*11)%5),baseRunningTrait:1+((i*13)%5),baseballIQTrait:1+((i*17)%5),
      characterSeed:"distribution-"+i
    });
    p.developmentState.skillProgress[targetSkill]=(i*37)%100;
    const result=applyDevelopmentResult(p,__devContext("distribution-"+i,{
      targetSkill,activityType:activities[i%activities.length],difficulty:difficulties[i%difficulties.length],quality:qualities[i%qualities.length],playerChoice:"choice-"+(i%4)
    }));
    if(result.status==="duplicate") duplicates++;
    if(!result.ok) { missingProvenance++; continue; }
    const record=result.result;
    gains.push(record.progressGained);
    levelUps+=record.levelUps;
    if(!Number.isFinite(record.progressGained)||!Number.isFinite(record.progressAfter)) nan++;
    if(record.progressGained<0||record.progressAfter<0) negative++;
    if(record.skillAfter>20) aboveCap++;
    if(!record.sourceId) missingSource++;
    if(!p.developmentState.history.length||!record.formulaVersion) missingProvenance++;
  }
  const sorted=gains.slice().sort((a,b)=>a-b);
  return {
    samples:gains.length,
    mean:gains.reduce((s,v)=>s+v,0)/gains.length,
    median:sorted[Math.floor(sorted.length/2)],
    min:sorted[0],max:sorted[sorted.length-1],
    levelUps,levelUpFrequency:levelUps/gains.length,
    errors:{nan,negative,aboveCap,missingSource,missingProvenance,duplicates}
  };
})()`);
verify("43. Distribution audit 完成 1000 deterministic outcomes", distribution.samples === 1000);
verify("44. Distribution audit NaN／negative／skill>20 全為 0", distribution.errors.nan === 0 && distribution.errors.negative === 0 && distribution.errors.aboveCap === 0);
verify("45. Distribution audit source／provenance missing 與 duplicate settlement 全為 0", distribution.errors.missingSource === 0 && distribution.errors.missingProvenance === 0 && distribution.errors.duplicates === 0);
verify("46. Distribution 是 progress-first，level-up 並非每次發生", distribution.levelUpFrequency > 0 && distribution.levelUpFrequency < 1);

const explainabilityExamples = parse(`(() => {
  const accumulating=__makeDevPlayer({skill:5,characterSeed:"example-normal"});
  const accumulatingResult=applyDevelopmentResult(accumulating,__devContext("example-normal")).result;
  const levelUp=__makeDevPlayer({skill:5,characterSeed:"example-level"});
  levelUp.developmentState.skillProgress.batting=91;
  const levelUpResult=applyDevelopmentResult(levelUp,__devContext("example-level")).result;
  const refinement=__makeDevPlayer({skill:17,characterSeed:"example-refinement"});
  const refinementResult=applyDevelopmentResult(refinement,__devContext("example-refinement")).result;
  return {accumulating:accumulatingResult,levelUp:levelUpResult,refinement:refinementResult};
})()`);

console.log(`\nDevelopment / Training Result Foundation v1：${passed}/${passed} 通過`);
console.log(`DEVELOPMENT_STRUCTURAL_AUDIT_JSON=${JSON.stringify({ traitAudit, skillAudit, biasAudit, fitAudit })}`);
console.log(`DEVELOPMENT_DISTRIBUTION_AUDIT_JSON=${JSON.stringify(distribution)}`);
console.log(`DEVELOPMENT_EXPLAINABILITY_EXAMPLES_JSON=${JSON.stringify(explainabilityExamples)}`);
console.log("This is structural validation, not population balance.");
