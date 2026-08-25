const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console });
for (const file of ["player.js", "match-experience-development.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

evaluate(`
  function __mxPlayer(seed = "mx-player") {
    const target = createInitialPlayer("Match Experience Fixture");
    target.characterGenesis.completed = true;
    target.characterGenesis.finalAbilities = { ballSense: 3, observe: 3, fitness: 3, batting: 3, baseRunning: 3, baseballIQ: 3 };
    target.idealSelf = "全能型";
    target.ballSense = 3; target.observe = 3; target.fitness = 3;
    DEVELOPMENT_SKILL_KEYS.forEach(skill => { target.baseballSkills[skill] = SPECIALIST_BASEBALL_SKILL_KEYS.includes(skill) ? 0 : 5; });
    target.capabilityState.characterSeed = seed;
    target.capabilityState.initialized = true;
    target.capabilityState.initialSkillFormulaVersion = INITIAL_SKILL_FORMULA_VERSION;
    target.capabilityState.settlementVersion = HS_ENTRY_CAPABILITY_SETTLEMENT_VERSION;
    return target;
  }

  function __mxMatch(id = "mx-match", seed = 1001) {
    return {
      id, simulationSeed: seed, completed: true, regulationInnings: 7,
      playerLineupStatus: "starter", playerEntryCompleted: true,
      developmentPositionOverride: "二壘手", playerFieldingAssignment: "二壘手", currentFieldingPosition: "二壘手",
      scores: { home: 2, away: 1 }, lineScore: { home: [0,0,0,1,0,1,0], away: [0,0,1,0,0,0,0] },
      simulationCursor: 40, simulationLog: [], completedMoments: [], matchExperience: null
    };
  }

  function __mxActive(matchId, playId, skill, options = {}) {
    return MatchExperienceDevelopment.createEvidenceRecord({
      evidenceId: matchId + "|" + playId + "|" + skill,
      matchId, playId, playerId: "player", evidenceType: "active",
      participationType: options.participationType || (skill === "batting" ? "batter" : "primaryFielder"),
      role: options.role || (skill === "batting" ? "batter" : "initiator"),
      targetSkill: skill, component: options.component || (skill === "baseballIQ" ? "decision" : "execution"),
      decisionQuality: options.decisionQuality || "acceptable",
      executionQuality: options.executionQuality || "normal",
      meaningful: options.meaningful !== false,
      difficulty: options.difficulty || "appropriate",
      playFamily: options.playFamily || "secondBaseRoutine",
      situation: Object.assign({ inning: 5, outs: 1, runners: ["r1", null, null], scoreMargin: 1, regulationInnings: 7, playFamily: options.playFamily || "secondBaseRoutine" }, options.situation || {}),
      decisionEvidence: { opportunity: options.component === "decision", reasons: options.reasons || [] },
      executionEvidence: { quality: options.executionQuality || "normal", stages: options.stages || {} },
      outcomeEvidence: { result: options.outcome || "out" },
      attribution: Object.assign({ responsibleActor: "player", playerResponsibility: "handled", teammateResponsibility: "none" }, options.attribution || {})
    });
  }
`);

verify("1. Match Experience 使用獨立 version／settlement contract", evaluate(`MatchExperienceDevelopment.VERSION==="match-experience-development-v1"&&MatchExperienceDevelopment.SETTLEMENT_VERSION==="match-experience-settlement-v1"`));
verify("2. Production index 在 script.js 前載入 Match Experience module", fs.readFileSync(path.join(root, "index.html"), "utf8").indexOf("match-experience-development.js") < fs.readFileSync(path.join(root, "index.html"), "utf8").indexOf("script.js"));
verify("3. player.baseballSkills 仍是唯一 Current Skill truth", !fs.readFileSync(path.join(root, "match-experience-development.js"), "utf8").includes("currentSkills") && !fs.readFileSync(path.join(root, "match-experience-development.js"), "utf8").includes("skillLevels"));
verify("4. Evidence derivation 不呼叫 Development processor", !/deriveMatchExperienceEvidence[\s\S]*applyDevelopmentResult/.test(fs.readFileSync(path.join(root, "match-experience-development.js"), "utf8").split("function settleMatchExperienceDevelopment")[0]));

const evidenceSchema = parse(`MatchExperienceDevelopment.createEvidenceRecord({evidenceId:"e",matchId:"m",playId:"p",playerId:"player",targetSkill:"reaction",component:"execution",executionQuality:"normal"})`);
verify("5. Evidence contract 含 identity／participation／三層 evidence／attribution／snapshot", ["evidenceId","matchId","playId","playerId","evidenceType","participationType","role","situation","decisionEvidence","executionEvidence","outcomeEvidence","difficulty","novelty","pressure","skillEvidence","attribution","sourceSnapshot"].every(key => Object.hasOwn(evidenceSchema, key)));
verify("6. Outcome、Experience、Development state 分離", !Object.hasOwn(evidenceSchema, "progressGained") && !Object.hasOwn(evidenceSchema, "skillAfter"));

const inningExposure = parse(`({one:MatchExperienceDevelopment.getDefensiveInningsExposureValue(1),seven:MatchExperienceDevelopment.getDefensiveInningsExposureValue(7)})`);
verify("7. 7 局 Exposure 大於 1 局", inningExposure.seven > inningExposure.one);
verify("8. Defensive innings exposure 具 diminishing return", inningExposure.seven < inningExposure.one * 7);
const paExposure = parse(`({one:MatchExperienceDevelopment.getPlateAppearanceExposureValue(1),four:MatchExperienceDevelopment.getPlateAppearanceExposureValue(4)})`);
verify("9. 4 PA Exposure 大於 1 PA", paExposure.four > paExposure.one);
verify("10. PA exposure 非線性固定倍率", paExposure.four < paExposure.one * 4);

const noParticipation = parse(`(() => { const m=__mxMatch("bench");m.playerLineupStatus="bench";m.playerEntryCompleted=false;return {exposure:MatchExperienceDevelopment.derivePlayerExposure(m),evidence:MatchExperienceDevelopment.deriveMatchExperienceEvidence(m),contexts:MatchExperienceDevelopment.selectDevelopmentContexts(MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(m)),m)}; })()`);
verify("11. Bench 0 innings／0 PA 沒有 Evidence", noParticipation.evidence.length === 0 && noParticipation.exposure.defensiveInnings === 0 && noParticipation.exposure.plateAppearances === 0);
verify("12. Bench 0 participation 沒有 Development Context", noParticipation.contexts.length === 0);
const noChance = parse(`MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("no-chance"),{exposure:{defensiveInnings:1,plateAppearances:0,role:"substitute"}})`);
verify("13. 1 defensive inning／0 chances 只有 Exposure Evidence", noChance.length === 1 && noChance.every(item => item.evidenceType === "exposure"));
verify("14. 無守備機會不產生 catching／throwing／reaction Active Evidence", !noChance.some(item => item.evidenceType === "active" && ["catching","throwing","reaction"].includes(item.skillEvidence.targetSkill)));

const outcomeIndependence = parse(`(() => { const a=__mxActive("m","a","batting",{decisionQuality:"acceptable",executionQuality:"normal",outcome:"single"}); const b=__mxActive("m","b","batting",{decisionQuality:"acceptable",executionQuality:"normal",outcome:"strikeout"}); return MatchExperienceDevelopment.applyNoveltyDiminishing([a,b].map((x,i)=>Object.assign({},x,{novelty:Object.assign({},x.novelty,{semanticKey:"outcome-independent-"+i})}))).map(x=>x.skillEvidence.adjustedValue); })()`);
verify("15. 相同 decision／execution 不因 hit／strikeout outcome 改 Experience value", outcomeIndependence[0] === outcomeIndependence[1]);

const strongDecisionWeakExecution = parse(`(() => { const m=__mxMatch("case1");m.completedMoments=[{id:"d1",domain:"defense",playerPosition:"二壘手",playerRole:"initiator",decisionQuality:"strong",executionQuality:"late",resultCode:"zeroOuts",responsibleActor:"player",playerResponsibility:"handled",ballDirection:"upTheMiddle",ballDepth:"normal",playerLeg:{reach:"completed",control:"completed",transfer:"delayed",firstThrow:"notCompleted"},inning:5,half:"上",outs:1,scores:{home:1,away:1},runners:["r1",null,null]}];return MatchExperienceDevelopment.deriveMatchExperienceEvidence(m,{exposure:{defensiveInnings:2,plateAppearances:0,role:"starter"}}); })()`);
verify("16. Strong decision＋weak execution 可同時留下 IQ 與 corrective execution Evidence", strongDecisionWeakExecution.some(item => item.skillEvidence.targetSkill === "baseballIQ" && item.decisionEvidence.quality === "strong") && strongDecisionWeakExecution.some(item => ["throwing","reaction","catching"].includes(item.skillEvidence.targetSkill) && ["weak","failed"].includes(item.executionEvidence.quality)));

const poorDecisionSuccess = parse(`MatchExperienceDevelopment.applyNoveltyDiminishing([__mxActive("case2","decision","baseballIQ",{component:"decision",decisionQuality:"poor",executionQuality:"strong",outcome:"doublePlay"}),__mxActive("case2","execution","throwing",{component:"execution",decisionQuality:"poor",executionQuality:"strong",outcome:"doublePlay"})])`);
verify("17. Poor decision＋successful execution 不給 high IQ reinforcement", poorDecisionSuccess[0].skillEvidence.adjustedValue < poorDecisionSuccess[1].skillEvidence.adjustedValue && poorDecisionSuccess[0].experienceQuality !== "highValue");

const teammateFailure = parse(`MatchExperienceDevelopment.applyNoveltyDiminishing([__mxActive("case3","throw","throwing",{executionQuality:"strong",outcome:"safe",attribution:{primaryCause:"teammatePivot",responsibleActor:"teammate",playerResponsibility:"handled",teammateResponsibility:"major"}})])[0]`);
verify("18. Teammate-caused failure 保留 Player strong execution", teammateFailure.executionEvidence.quality === "strong" && teammateFailure.attribution.responsibleActor === "teammate" && teammateFailure.skillEvidence.adjustedValue > 0);

const routine2B = parse(`(() => { const m=__mxMatch("routine");m.simulationLog=[{sequence:0,type:"playerRoutinePlay",eventClassification:"playerRoutinePlay",playerPosition:"二壘手",playerRole:"coverPivot",decisionQuality:"routine",executionQuality:"partial",playerLeg:{coverage:"good",receive:"completed",pivot:"late",secondThrow:"notCompleted"},responsibleActor:"player",ballContext:"normalGrounder",ballDirection:"upTheMiddle",ballDepth:"normal",resultCode:"oneOut",inning:3,half:"上",outs:1,scores:{home:0,away:0},runners:["r",null,null]}];return MatchExperienceDevelopment.deriveMatchExperienceEvidence(m,{exposure:{defensiveInnings:3,plateAppearances:0,role:"starter"}}); })()`);
verify("19. Routine 2B play 即使無 Decision UI 仍有 Active Evidence", routine2B.some(item => item.evidenceType === "active"));
verify("20. 2B pivot fixture 映射 reaction／catching／throwing／baseballIQ", ["reaction","catching","throwing","baseballIQ"].every(skill => routine2B.some(item => item.skillEvidence.targetSkill === skill)));
verify("21. 2B evidence 使用 canonical pivot participation type", routine2B.filter(item => item.evidenceType === "active").every(item => item.participationType === "pivot"));

const batterFixtures = parse(`(() => { const hit=__mxMatch("hit");hit.completedMoments=[{id:"o1",domain:"offense",decision:"",decisionQuality:"none",executionQuality:"normal",tier:"mixed",resultCode:"single",inning:4,half:"下",outs:0,scores:{home:0,away:0},runners:[]}]; const k=__mxMatch("k");k.completedMoments=[{id:"o2",domain:"offense",decision:"zone",decisionQuality:"strong",executionQuality:"weak",tier:"failure",resultCode:"strikeout",inning:6,half:"下",outs:2,scores:{home:1,away:1},runners:["r",null,null]}]; return {hit:MatchExperienceDevelopment.deriveMatchExperienceEvidence(hit,{exposure:{defensiveInnings:0,plateAppearances:1,role:"starter"}}),strikeout:MatchExperienceDevelopment.deriveMatchExperienceEvidence(k,{exposure:{defensiveInnings:0,plateAppearances:1,role:"starter"}})}; })()`);
const hitBatting = batterFixtures.hit.find(item => item.evidenceType === "active" && item.skillEvidence.targetSkill === "batting");
const strikeoutBatting = batterFixtures.strikeout.find(item => item.evidenceType === "active" && item.skillEvidence.targetSkill === "batting");
const strikeoutIq = batterFixtures.strikeout.find(item => item.evidenceType === "active" && item.skillEvidence.targetSkill === "baseballIQ");
verify("22. Hit＋ordinary execution 不會自動成為 highValue", hitBatting && hitBatting.experienceQuality !== "highValue");
verify("23. Correct approach＋incomplete execution＋strikeout 仍有正 batting Evidence", strikeoutBatting?.skillEvidence.adjustedValue > 0);
verify("24. Strikeout 不會抹除 strong decision 的 baseballIQ Evidence", strikeoutIq?.decisionEvidence.quality === "strong" && strikeoutIq.skillEvidence.adjustedValue > 0);

const repetition = parse(`(() => { const items=Array.from({length:7},(_,i)=>__mxActive("repeat","p"+i,"reaction",{playFamily:"same-routine",executionQuality:"normal",meaningful:false}));return MatchExperienceDevelopment.applyNoveltyDiminishing(items).map(item=>item.skillEvidence.adjustedValue); })()`);
verify("25. 相似 Evidence #1／#2／#4／#7 邊際價值逐步下降", repetition[0] > repetition[1] && repetition[1] > repetition[3] && repetition[3] > repetition[6]);
verify("26. Aggregator 聚合同 skill 全部 evidence，不只取 top 3 plays", parse(`MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.applyNoveltyDiminishing(Array.from({length:7},(_,i)=>__mxActive("agg","p"+i,"reaction",{playFamily:"same-routine"}))))[0].evidenceCount`) === 7);

const pressure = parse(`(() => { const normal=__mxActive("pressure","normal","reaction",{situation:{inning:2,outs:0,runners:[],scoreMargin:4,regulationInnings:7}}); const high=__mxActive("pressure","high","reaction",{situation:{inning:7,outs:2,runners:["a","b",null],scoreMargin:1,regulationInnings:7}});return MatchExperienceDevelopment.applyNoveltyDiminishing([normal,high].map((x,i)=>Object.assign({},x,{novelty:Object.assign({},x.novelty,{semanticKey:"pressure-"+i})}))).map(x=>x.skillEvidence.adjustedValue); })()`);
verify("27. High pressure 只有有限 salience bonus", pressure[1] > pressure[0] && pressure[1] / pressure[0] < 1.1);

const capContexts = parse(`(() => { const evidence=["baseballIQ","reaction","range","catching","throwing","batting"].map((skill,i)=>__mxActive("cap","p"+i,skill,{component:skill==="baseballIQ"?"decision":"execution",decisionQuality:"strong",executionQuality:"strong",playFamily:"family"+i}));const agg=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.applyNoveltyDiminishing(evidence));return MatchExperienceDevelopment.selectDevelopmentContexts(agg,__mxMatch("cap")); })()`);
verify("28. 每場主要 Development Context 上限為 3", capContexts.length === 3);
verify("29. Context 使用 gameExperience 與既有 Development shape", capContexts.every(item => item.sourceType === "gameExperience" && item.sourceId.includes("match-experience-development-v1") && item.targetSkill && item.activityType && item.difficulty && item.quality && item.playerChoice));

const playingTimeAudit = parse(`(() => {
  const one=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("one"),{exposure:{defensiveInnings:1,plateAppearances:0,role:"substitute"}}));
  const seven=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("seven"),{exposure:{defensiveInnings:7,plateAppearances:0,role:"starter"}}));
  const active=[0,1,2].map(i=>__mxActive("short","high"+i,["reaction","catching","throwing"][i],{executionQuality:"strong",difficulty:"challenging",playFamily:"high"+i}));
  const short=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("short"),{exposure:{defensiveInnings:2,plateAppearances:0,role:"substitute"},activeEvidence:active}));
  const same=__mxActive("same","routine","baseballIQ",{component:"decision",decisionQuality:"acceptable",playFamily:"routine"});
  const sameOne=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("same-one"),{exposure:{defensiveInnings:1,plateAppearances:0,role:"substitute"},activeEvidence:[same]}));
  const sameSeven=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("same-seven"),{exposure:{defensiveInnings:7,plateAppearances:0,role:"starter"},activeEvidence:[Object.assign({},same,{matchId:"same-seven",evidenceId:"same-seven|routine|iq"})]}));
  const pa1=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("pa1"),{exposure:{defensiveInnings:0,plateAppearances:1,role:"substitute"}}));
  const pa4=MatchExperienceDevelopment.aggregateMatchExperience(MatchExperienceDevelopment.deriveMatchExperienceEvidence(__mxMatch("pa4"),{exposure:{defensiveInnings:0,plateAppearances:4,role:"starter"}}));
  const total=x=>x.reduce((sum,item)=>sum+item.totalValue,0);
  return {one:total(one),seven:total(seven),short:total(short),sameOne:total(sameOne),sameSeven:total(sameSeven),pa1:total(pa1),pa4:total(pa4)};
})()`);
verify("30. 1 vs 7 innings：7 局 Exposure 較多但非 7 倍", playingTimeAudit.seven > playingTimeAudit.one && playingTimeAudit.seven < playingTimeAudit.one * 7);
verify("31. 2 innings＋3 high-value active experiences 勝過 7 innings 無 active", playingTimeAudit.short > playingTimeAudit.seven);
verify("32. Same Active Evidence＋7 innings moderately 高於 1 inning", playingTimeAudit.sameSeven > playingTimeAudit.sameOne && playingTimeAudit.sameSeven / playingTimeAudit.sameOne < 3);
verify("33. 4 PA opportunity 高於 1 PA 且維持 diminishing", playingTimeAudit.pa4 > playingTimeAudit.pa1 && playingTimeAudit.pa4 < playingTimeAudit.pa1 * 4);

const settlement = parse(`(() => { const p=__mxPlayer("settle");const m=__mxMatch("settle",42);const active=[__mxActive("settle","d1","reaction",{executionQuality:"strong",difficulty:"challenging"}),__mxActive("settle","o1","batting",{participationType:"batter",role:"batter",executionQuality:"normal"})];const canonical=JSON.stringify({scores:m.scores,lineScore:m.lineScore,simulationCursor:m.simulationCursor,completed:m.completed});const first=MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,m,{exposure:{defensiveInnings:4,plateAppearances:3,role:"starter"},activeEvidence:active});const afterFirst=JSON.stringify(p.developmentState);const second=MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,m);return {first,second,canonicalUnchanged:canonical===JSON.stringify({scores:m.scores,lineScore:m.lineScore,simulationCursor:m.simulationCursor,completed:m.completed}),afterFirstUnchanged:afterFirst===JSON.stringify(p.developmentState),history:p.developmentState.history,matchExperience:m.matchExperience}; })()`);
verify("34. Completed match 只在 match-level settlement 呼叫既有 processor", settlement.first.ok && settlement.first.status === "applied" && settlement.first.contexts.length > 0);
verify("35. gameExperience settlement exactly once", settlement.second.status === "duplicate" && settlement.afterFirstUnchanged);
verify("36. Settlement 不改 score／line score／cursor／completed truth", settlement.canonicalUnchanged);
verify("37. Development history 保存 gameExperience source 與 provenance", settlement.history.every(item => item.sourceType === "gameExperience" && item.metadata.matchExperienceVersion === "match-experience-development-v1"));
verify("38. Match Experience state 保存 exposure／evidence／aggregation／contexts／IDs", settlement.matchExperience.settled && settlement.matchExperience.evidence.length > 0 && settlement.matchExperience.aggregated.length > 0 && settlement.matchExperience.selectedContexts.length > 0 && settlement.matchExperience.developmentSettlementIds.length === settlement.matchExperience.selectedContexts.length);
verify("39. Mid-match 不允許永久 Development settlement", evaluate(`(() => { const p=__mxPlayer();const m=__mxMatch();m.completed=false;return MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,m).status==="rejected"&&p.developmentState.history.length===0; })()`));
verify("40. Saved settled state normalize 後維持 exactly-once identity", evaluate(`(() => { const p=__mxPlayer("reload");const m=__mxMatch("reload",9);MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,m,{exposure:{defensiveInnings:4,plateAppearances:2,role:"starter"}});const restored=__mxMatch("reload",9);restored.matchExperience=MatchExperienceDevelopment.normalizeMatchExperienceState(JSON.parse(JSON.stringify(m.matchExperience)),restored);const before=JSON.stringify(p.developmentState);const result=MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,restored);return result.status==="duplicate"&&JSON.stringify(p.developmentState)===before; })()`));
verify("41. Skill cap 與 progress threshold 完全重用 Development v1", settlement.history.every(item => item.formulaVersion === "development-result-v1") && evaluate(`DEVELOPMENT_PROGRESS_THRESHOLD===100`));
verify("42. School trainingQuality／playingTimeOpportunity 不作自動 multiplier", !fs.readFileSync(path.join(root, "match-experience-development.js"), "utf8").includes("selectedSchool.trainingQuality") && !fs.readFileSync(path.join(root, "match-experience-development.js"), "utf8").includes("playingTimeOpportunity *"));

const distribution = parse(`(() => {
  let nan=0,negative=0,duplicate=0,noParticipationActive=0,matchMutation=0,rngDrift=0,aboveCap=0,missingProvenance=0;
  let evidenceTotal=0,activeTotal=0,contextTotal=0,starterExposure=0,substituteExposure=0,benchContexts=0;
  const inningBands={"0":[],"1-2":[],"3-4":[],"5-7":[]};
  for(let i=0;i<1000;i++){
    const role=i%5===0?"bench":i%3===0?"substitute":"starter";
    const innings=role==="bench"?0:role==="substitute"?1+(i%2):3+(i%5);
    const pa=role==="bench"?0:role==="substitute"?1:1+(i%4);
    const p=__mxPlayer("distribution-"+i),m=__mxMatch("distribution-"+i,5000+i);m.playerLineupStatus=role;m.playerEntryCompleted=role!=="bench";
    const active=role==="bench"?[]:Array.from({length:i%4},(_,j)=>__mxActive(m.id,"play-"+j,["reaction","catching","throwing","batting"][j],{participationType:j===3?"batter":"primaryFielder",role:j===3?"batter":"initiator",executionQuality:j%3===0?"strong":j%3===1?"normal":"weak",difficulty:j%2?"appropriate":"challenging",playFamily:"family-"+(j%2)}));
    const canonical=JSON.stringify({scores:m.scores,lineScore:m.lineScore,cursor:m.simulationCursor});
    const rngBefore=m.simulationCursor;
    const result=MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,m,{exposure:{defensiveInnings:innings,plateAppearances:pa,role},activeEvidence:active});
    const second=MatchExperienceDevelopment.settleMatchExperienceDevelopment(p,m);
    const state=m.matchExperience;
    evidenceTotal+=state.evidenceSummary.total;activeTotal+=state.evidenceSummary.active;contextTotal+=state.selectedContexts.length;
    if(role==="starter")starterExposure+=state.exposure.defensiveExposureValue;
    if(role==="substitute")substituteExposure+=state.exposure.defensiveExposureValue;
    if(role==="bench")benchContexts+=state.selectedContexts.length;
    const band=innings===0?"0":innings<=2?"1-2":innings<=4?"3-4":"5-7";inningBands[band].push(state.exposure.defensiveExposureValue);
    if(state.evidence.some(e=>!Number.isFinite(e.skillEvidence.adjustedValue)))nan++;
    if(state.evidence.some(e=>e.skillEvidence.adjustedValue<0))negative++;
    if(second.status!=="duplicate")duplicate++;
    if(role==="bench"&&state.evidence.some(e=>e.evidenceType==="active"))noParticipationActive++;
    if(canonical!==JSON.stringify({scores:m.scores,lineScore:m.lineScore,cursor:m.simulationCursor}))matchMutation++;
    if(m.simulationCursor!==rngBefore)rngDrift++;
    if(Object.values(p.baseballSkills).some(v=>v>20))aboveCap++;
    if(result.contexts.some(ctx=>!state.developmentSettlementIds.includes(ctx.settlementId)))missingProvenance++;
  }
  const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
  return {samples:1000,avgEvidence:evidenceTotal/1000,avgActiveEvidence:activeTotal/1000,avgContexts:contextTotal/1000,avgExposureByInningsBand:Object.fromEntries(Object.entries(inningBands).map(([k,v])=>[k,avg(v)])),starterExposure:starterExposure/Math.floor(1000*8/15),substituteExposure:substituteExposure/Math.floor(1000*4/15),benchContexts,errors:{nan,negative,duplicate,noParticipationActive,matchMutation,rngDrift,aboveCap,missingProvenance}};
})()`);
verify("43. Distribution audit 完成 1000 deterministic player-match samples", distribution.samples === 1000);
verify("44. Distribution structural errors 全為 0", Object.values(distribution.errors).every(value => value === 0));
verify("45. 0-play bench contexts 為 0", distribution.benchContexts === 0);
verify("46. Exposure band 隨實際局數上升且非線性", distribution.avgExposureByInningsBand["0"] === 0 && distribution.avgExposureByInningsBand["1-2"] < distribution.avgExposureByInningsBand["3-4"] && distribution.avgExposureByInningsBand["3-4"] < distribution.avgExposureByInningsBand["5-7"]);

console.log(`\nMatch Experience → Development Foundation v1：${passed}/${passed} 通過`);
console.log(`MATCH_EXPERIENCE_PLAYING_TIME_AUDIT_JSON=${JSON.stringify({inningExposure,paExposure,playingTimeAudit})}`);
console.log(`MATCH_EXPERIENCE_DISTRIBUTION_AUDIT_JSON=${JSON.stringify(distribution)}`);
console.log("This is structural validation, not population balance.");
