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
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-development-runtime-resolver.js",
  "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];

let passed = 0;
function verify(title, condition) {
  if (!condition) throw new Error(title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        innerHTML: "",
        value: "",
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        focus() {},
        setAttribute() {},
        removeAttribute() {}
      });
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout(callback) { callback(); } },
    module: { exports: {} }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  return { context, storage, nodes };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parse(context, expression) {
  return JSON.parse(evaluate(context, `JSON.stringify(${expression})`));
}

function resetToYearTwo(context, overrides = {}) {
  evaluate(context, `player = createInitialPlayer("訓練測試球員"); Object.assign(player, ${JSON.stringify({
    chapter: "青棒第二年",
    age: 17,
    highSchoolYearTwoStep: 0,
    seasonPosition: "內野手",
    ...overrides
  })}); pendingYouthSeasonOutcome = null; pendingBaseballGameplay = null; pendingTrainingOutcome = null; isTransitioning = false;`);
}

const resolverContext = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, "baseball-training-resolver.js"), "utf8"), resolverContext);
const resolverInput = {
  ballSense: 5,
  discipline: 5,
  baseballSkills: { batting: 5, reaction: 5, range: 5, throwing: 5 },
  body: { fatigue: 6 }
};
const resolverInputBefore = JSON.stringify(resolverInput);
const expectedEffects = {
  "power-hitting": { traits: {}, targetSkill: "batting", fatigue: 2 },
  "contact-control": { traits: { ballSense: 1, discipline: 1 }, targetSkill: "batting", fatigue: 1 },
  "defensive-footwork": { traits: {}, targetSkill: "reaction", fatigue: 1 },
  "throwing-basics": { traits: {}, targetSkill: "throwing", fatigue: 1 },
  recovery: { traits: {}, targetSkill: null, fatigue: -2 }
};

Object.entries(expectedEffects).forEach(([code, expected]) => {
  const result = JSON.parse(vm.runInContext(`JSON.stringify(BaseballTrainingResolver.resolveTraining(${JSON.stringify(resolverInput)}, ${JSON.stringify(code)}))`, resolverContext));
  verify(`${code} 可被決定性解析`, result.status === "resolved" && result.code === code);
  verify(`${code} 回傳正確非 Development 效果與 context`, JSON.stringify(result.topLevelDeltas) === JSON.stringify(expected.traits)
    && (result.developmentContext?.targetSkill || null) === expected.targetSkill
    && result.bodyDeltas.fatigue === expected.fatigue);
});
verify("Resolver 不修改輸入 Snapshot", JSON.stringify(resolverInput) === resolverInputBefore);
verify("Resolver 輸出與巢狀資料皆為唯讀", vm.runInContext(`(() => { const r = BaseballTrainingResolver.resolveTraining(${JSON.stringify(resolverInput)}, "contact-control"); return Object.isFrozen(r) && Object.isFrozen(r.topLevelDeltas) && Object.isFrozen(r.developmentContext) && Object.isFrozen(r.changes) && r.changes.every(Object.isFrozen); })()`, resolverContext));
verify("未知訓練代碼 fail closed", vm.runInContext(`BaseballTrainingResolver.resolveTraining(${JSON.stringify(resolverInput)}, "unknown").status`, resolverContext) === "unresolved");
verify("Resolver 公開的五個訓練代碼與規格一致", vm.runInContext("JSON.stringify(BaseballTrainingResolver.TRAINING_CODES)", resolverContext) === JSON.stringify(Object.keys(expectedEffects)));
verify("非 Development 效果與疲勞仍依既有 0–20 範圍截斷", vm.runInContext(`(() => { const r = BaseballTrainingResolver.resolveTraining({ ballSense:20, discipline:20, body:{ fatigue:19 } }, "contact-control"); return r.topLevelDeltas.ballSense === 0 && r.topLevelDeltas.discipline === 0 && r.bodyDeltas.fatigue === 1 && r.after.body.fatigue === 20; })()`, resolverContext));
verify("低疲勞恢復不會降到零以下", vm.runInContext(`(() => { const r = BaseballTrainingResolver.resolveTraining({ ballSense:1, discipline:1, baseballSkills:{ batting:1, reaction:1, range:1, throwing:1 }, body:{ fatigue:1 } }, "recovery"); return r.bodyDeltas.fatigue === -1 && r.after.body.fatigue === 0; })()`, resolverContext));

const { context, storage, nodes } = makeContext();
resetToYearTwo(context);
const schemaBefore = parse(context, "Object.keys(createInitialPlayer('a')).sort()");
verify("高二仍由原本名單重排事件開始", evaluate(context, "getCurrentEventId()") === "high_school_year_two_roster_reset");
evaluate(context, "choose('high_school_year_two_roster_reset', 0)");
verify("名單重排後插入 Training A 且正式 step 只前進到 1", evaluate(context, "player.highSchoolYearTwoStep === 1 && getCurrentEventId() === 'high_school_year_two_training_a'"));
verify("Training A 提供五個固定且具體的選項", evaluate(context, "getEvent('high_school_year_two_training_a').choices.length === 5 && getEvent('high_school_year_two_training_a').choices.every(choice => Boolean(choice.trainingCode))"));

const beforeA = parse(context, "({ ballSense: player.ballSense, discipline: player.discipline, fatigue: player.body.fatigue, batting: player.baseballSkills.batting, progress: player.developmentState.skillProgress.batting, step: player.highSchoolYearTwoStep })");
evaluate(context, "choose('high_school_year_two_training_a', 1)");
const afterA = parse(context, "({ ballSense: player.ballSense, discipline: player.discipline, fatigue: player.body.fatigue, batting: player.baseballSkills.batting, progress: player.developmentState.skillProgress.batting, history: player.developmentState.history.length, step: player.highSchoolYearTwoStep, forcedEventId: player.forcedEventId, flags: player.flags, coachTrust: player.relationships.coachTrust })");
verify("Training A 擊球控制保留原效果並累積 Development progress 一次", afterA.ballSense === beforeA.ballSense + 1 && afterA.discipline === beforeA.discipline + 1 && afterA.fatigue === beforeA.fatigue + 1 && afterA.batting === beforeA.batting && afterA.progress > beforeA.progress && afterA.history === 1);
verify("Training A 不推進正式高二 step 且清除暫時覆蓋", afterA.step === 1 && afterA.forcedEventId === "");
verify("Training A 只留下底線格式的對應選擇旗標", afterA.flags.filter(flag => flag.startsWith("hs_y2_training_a_")).join() === "hs_y2_training_a_contact_control");
verify("擊球控制最多觸發一次現任教練短回應", afterA.coachTrust === 1 && afterA.flags.includes("hs_y2_training_contact_coach_echo"));
verify("訓練結果停留、說明技術累積並提供單一繼續按鈕", Boolean(evaluate(context, "pendingTrainingOutcome")) && nodes.get("story").innerHTML.includes("技術學習") && nodes.get("story").innerHTML.includes("實際進展") && nodes.get("choices").innerHTML.includes("continueTrainingOutcome"));

const duplicateSnapshot = evaluate(context, "JSON.stringify(player)");
evaluate(context, "chooseHighSchoolTraining('high_school_year_two_training_a', 'contact-control')");
verify("結果停留期間重複操作不會再次套用", duplicateSnapshot === evaluate(context, "JSON.stringify(player)"));
evaluate(context, "saveGame()");
const savedAtOutcome = JSON.parse(storage.get("baseballLifeRpgSave"));
verify("完成訓練後可正常手動存檔且不儲存 pendingTrainingOutcome", savedAtOutcome.forcedEventId === "" && savedAtOutcome.flags.includes("hs_y2_training_a_contact_control") && !Object.prototype.hasOwnProperty.call(savedAtOutcome, "pendingTrainingOutcome"));

const committedA = parse(context, "({ ballSense: player.ballSense, discipline: player.discipline, fatigue: player.body.fatigue, progress: player.developmentState.skillProgress.batting, history: player.developmentState.history, flags: player.flags })");
evaluate(context, "continueTrainingOutcome()");
verify("Training A 繼續後不重複套用並回到原本角色測試", JSON.stringify(committedA) === JSON.stringify(parse(context, "({ ballSense: player.ballSense, discipline: player.discipline, fatigue: player.body.fatigue, progress: player.developmentState.skillProgress.batting, history: player.developmentState.history, flags: player.flags })")) && evaluate(context, "getCurrentEventId()") === "high_school_year_two_role_test");
evaluate(context, "player.ballSense = 0; pendingTrainingOutcome = { stale: true }; loadGame()");
verify("Training A 存檔可讀回 progress、疲勞與旗標，且不殘留結果鎖定", evaluate(context, "player.ballSense") === savedAtOutcome.ballSense && evaluate(context, "player.body.fatigue") === savedAtOutcome.body.fatigue && evaluate(context, "player.developmentState.skillProgress.batting") === savedAtOutcome.developmentState.skillProgress.batting && evaluate(context, "player.flags.includes('hs_y2_training_a_contact_control') && pendingTrainingOutcome === null && getCurrentEventId() === 'high_school_year_two_role_test'"));
evaluate(context, "choose('high_school_year_two_role_test', 0)");
verify("角色測試後插入 Training B 且正式 step 只前進到 2", evaluate(context, "player.highSchoolYearTwoStep === 2 && getCurrentEventId() === 'high_school_year_two_training_b'"));

evaluate(context, "player.body.fatigue = 6");
const bodyBefore = evaluate(context, "BaseballGameplayIntegration.deriveBodyState(player.body)");
evaluate(context, "choose('high_school_year_two_training_b', 4)");
const bodyAfter = evaluate(context, "BaseballGameplayIntegration.deriveBodyState(player.body)");
verify("Training B 恢復把疲勞 6 降至 4", evaluate(context, "player.body.fatigue") === 4);
verify("恢復可讓既有 Body Adapter 從 fatigued 回到 normal", bodyBefore === "fatigued" && bodyAfter === "normal");
verify("Training B 只留下對應選擇旗標", evaluate(context, "player.flags.filter(flag => flag.startsWith('hs_y2_training_b_')).join()") === "hs_y2_training_b_recovery");
evaluate(context, "saveGame()");
const savedAfterB = JSON.parse(storage.get("baseballLifeRpgSave"));
evaluate(context, "continueTrainingOutcome()");
verify("Training B 繼續後接回原本春季聯賽", evaluate(context, "getCurrentEventId()") === "high_school_year_two_spring_game");
evaluate(context, "player.body.fatigue = 20; pendingTrainingOutcome = { stale: true }; loadGame()");
verify("Training B 存檔可讀回恢復結果並直接回到春季聯賽", evaluate(context, "player.body.fatigue") === savedAfterB.body.fatigue && evaluate(context, "player.flags.includes('hs_y2_training_b_recovery') && pendingTrainingOutcome === null && getCurrentEventId() === 'high_school_year_two_spring_game'"));

evaluate(context, `var __preDevelopmentSave=JSON.parse(JSON.stringify(player)); delete __preDevelopmentSave.developmentState; var __preDevelopmentSkills=JSON.stringify(__preDevelopmentSave.baseballSkills); var __preDevelopmentInvitations=JSON.stringify(__preDevelopmentSave.schoolInvitationState); var __migratedDevelopmentSave=normalizeSave(__preDevelopmentSave);`);
verify("8884e41-style save 會 deterministic 補 Development State", evaluate(context, "__migratedDevelopmentSave.developmentState.version === DEVELOPMENT_STATE_VERSION && DEVELOPMENT_SKILL_KEYS.every(skill => __migratedDevelopmentSave.developmentState.skillProgress[skill] === 0) && __migratedDevelopmentSave.developmentState.migration.preservedBaseballSkills === true"));
verify("Development migration 不改既有 Baseball Skills 或 School Invitation truth", evaluate(context, "JSON.stringify(__migratedDevelopmentSave.baseballSkills) === __preDevelopmentSkills && JSON.stringify(__migratedDevelopmentSave.schoolInvitationState) === __preDevelopmentInvitations"));

const powerRoute = makeContext();
resetToYearTwo(powerRoute.context, { body: { stamina: 10, fatigue: 0, injuryRisk: 0, pain: 0, injured: false, injuryDays: 0 } });
const powerBattingBefore = evaluate(powerRoute.context, "player.baseballSkills.batting");
evaluate(powerRoute.context, `choose('high_school_year_two_roster_reset', 0);
  var __powerFatigueBeforeA = player.body.fatigue; choose('high_school_year_two_training_a', 0); var __powerFatigueAfterA = player.body.fatigue;
  continueTrainingOutcome(); choose('high_school_year_two_role_test', 0);
  var __powerFatigueBeforeB = player.body.fatigue; choose('high_school_year_two_training_b', 0); var __powerFatigueAfterB = player.body.fatigue;
  continueTrainingOutcome();`);
verify("兩次長打訓練通常先累積進度而非每次固定提升技能", evaluate(powerRoute.context, "player.baseballSkills.batting") === powerBattingBefore && evaluate(powerRoute.context, "player.developmentState.skillProgress.batting > 0 && player.developmentState.history.filter(item => item.targetSkill === 'batting').length === 2") && evaluate(powerRoute.context, "__powerFatigueAfterA - __powerFatigueBeforeA === 2 && __powerFatigueAfterB - __powerFatigueBeforeB === 2"));
verify("兩次長打路線仍回到同一春季聯賽且 Slot 不會再次排入", evaluate(powerRoute.context, "getCurrentEventId() === 'high_school_year_two_spring_game' && !queueHighSchoolTrainingAfter('high_school_year_two_roster_reset') && !queueHighSchoolTrainingAfter('high_school_year_two_role_test')"));
verify("非擊球控制路線不會取得教練短回應", evaluate(powerRoute.context, "!player.flags.includes('hs_y2_training_contact_coach_echo')"));
verify("長打路線留下兩個底線格式旗標", evaluate(powerRoute.context, "player.flags.includes('hs_y2_training_a_power_hitting') && player.flags.includes('hs_y2_training_b_power_hitting')"));

const levelUpRoute = makeContext();
resetToYearTwo(levelUpRoute.context);
evaluate(levelUpRoute.context, `player.baseballSkills.batting=5; player.developmentState.skillProgress.batting=91; choose('high_school_year_two_roster_reset',0); var __levelSkillBefore=player.baseballSkills.batting; choose('high_school_year_two_training_a',1);`);
verify("Pilot training 跨門檻時永久提升 Current Baseball Skill", evaluate(levelUpRoute.context, "pendingTrainingOutcome.developmentResult.levelUps === 1 && player.baseballSkills.batting === __levelSkillBefore + 1 && player.developmentState.skillProgress.batting < 91"));
verify("Pilot level-up 結果以玩家可讀文字說明累積已固定", levelUpRoute.nodes.get("story").innerHTML.includes("能力有所提升") && !levelUpRoute.nodes.get("story").innerHTML.includes("progressGained"));

const defenseRoute = makeContext();
resetToYearTwo(defenseRoute.context, { seasonPosition: "內野手" });
evaluate(defenseRoute.context, `Object.assign(player.baseballSkills, { catching:5, reaction:5, range:5, throwing:3 }); Object.assign(player.matchState, { outs:1, runners:[true,false,false], awayScore:0, homeScore:0 });
  var __defenseBefore = BaseballGameplayIntegration.createYouthGrounderInput(player, { fieldingApproach:'secure', throwDecision:null }, { fieldingExecution:0.5, fieldingResult:0.5, throwExecution:0.5, result:0.5 });
  choose('high_school_year_two_roster_reset', 0);
  var __reactionBeforeTraining = player.baseballSkills.reaction; var __rangeBeforeTraining = player.baseballSkills.range;
  choose('high_school_year_two_training_a', 2);
  var __reactionAfterTraining = player.baseballSkills.reaction; var __rangeAfterTraining = player.baseballSkills.range;
  continueTrainingOutcome(); choose('high_school_year_two_role_test', 0);
  var __throwingBeforeTraining = player.baseballSkills.throwing; choose('high_school_year_two_training_b', 3); var __throwingAfterTraining = player.baseballSkills.throwing;
  continueTrainingOutcome();
  Object.assign(player.matchState, { outs:1, runners:[true,false,false], awayScore:0, homeScore:0 });
  var __defenseAfter = BaseballGameplayIntegration.createYouthGrounderInput(player, { fieldingApproach:'secure', throwDecision:null }, { fieldingExecution:0.5, fieldingResult:0.5, throwExecution:0.5, result:0.5 });`);
const defenseTrainingAudit = parse(defenseRoute.context, "({ reactionBefore:__reactionBeforeTraining, reactionAfter:__reactionAfterTraining, rangeBefore:__rangeBeforeTraining, rangeAfter:__rangeAfterTraining, throwingBefore:__throwingBeforeTraining, throwingAfter:__throwingAfterTraining, reactionProgress:player.developmentState.skillProgress.reaction, throwingProgress:player.developmentState.skillProgress.throwing })");
verify("守備腳步與基本傳球先累積各自 progress，不提前改寫 Current Skill truth", defenseTrainingAudit.reactionAfter === defenseTrainingAudit.reactionBefore && defenseTrainingAudit.rangeAfter === defenseTrainingAudit.rangeBefore && defenseTrainingAudit.throwingAfter === defenseTrainingAudit.throwingBefore && defenseTrainingAudit.reactionProgress > 0 && defenseTrainingAudit.throwingProgress > 0);
verify("攻守混合路線仍回到同一春季聯賽", evaluate(defenseRoute.context, "getCurrentEventId()") === "high_school_year_two_spring_game");

evaluate(context, `var __sourceState = createInitialPlayer("來源測試"); Object.assign(__sourceState, { ballSense: 5, observe: 5, fitness: 4, discipline: 5, idealSelf: "守備型" }); Object.assign(__sourceState.characterGenesis, { completed: true, finalAbilities: { ballSense:5, observe:5, fitness:4, batting:3, baseRunning:3, baseballIQ:4 } }); Object.assign(__sourceState.baseballSkills, { batting: 6, baseballIQ: 5, baseRunning: 5, catching: 4, reaction: 5, range: 4, throwing: 5 }); Object.assign(__sourceState.body, { fatigue: 0, pain: 0, injuryRisk: 0 }); Object.assign(__sourceState.matchState, { outs: 1, runners: [false, true, false], awayScore: 1, homeScore: 1 });
  var __offenseBefore = BaseballGameplayIntegration.createHighSchoolYearTwoSpringInput(__sourceState, "opposite", { execution: 0.5, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 });
  var __contactTraining = BaseballTrainingResolver.resolveTraining(__sourceState, "contact-control");
  __sourceState.ballSense += __contactTraining.topLevelDeltas.ballSense; __sourceState.discipline += __contactTraining.topLevelDeltas.discipline;
  var __offenseAfter = BaseballGameplayIntegration.createHighSchoolYearTwoSpringInput(__sourceState, "opposite", { execution: 0.5, battedBall: 0.5, defense: 0.5, result: 0.5, runnerAdvance: 0.5 });
  var __fieldingBefore = BaseballGameplayIntegration.deriveFieldingScore(__sourceState.baseballSkills);
  var __footworkTraining = BaseballTrainingResolver.resolveTraining(__sourceState, "defensive-footwork");
  __sourceState.developmentState.skillProgress.reaction = 95;
  var __footworkDevelopment = applyDevelopmentResult(__sourceState, { ...__footworkTraining.developmentContext, sourceId:"adapter-proof", sourceType:"training", playerChoice:"defensive-footwork" });
  var __fieldingAfter = BaseballGameplayIntegration.deriveFieldingScore(__sourceState.baseballSkills);`);
verify("擊球控制會改變 5.4 Offensive Adapter 的 contactScore 來源事實", evaluate(context, "__offenseAfter.adaptedFacts.contactScore > __offenseBefore.adaptedFacts.contactScore"));
verify("Development progress 跨門檻後才改變 Defense Adapter 的 Current Skill 來源事實", evaluate(context, "__footworkDevelopment.result.levelUps === 1 && __fieldingAfter > __fieldingBefore"));

verify("Player Schema 只以單一 developmentState 保存訓練進度", JSON.stringify(schemaBefore) === JSON.stringify(parse(context, "Object.keys(createInitialPlayer('b')).sort()")) && evaluate(context, "createInitialPlayer('b').developmentState.version") === "development-v1");
verify("SAVE_VERSION 升級為 15 且 localStorage key 保持不變", evaluate(context, "SAVE_VERSION === 15 && SAVE_KEY === 'baseballLifeRpgSave'"));
verify("高二 Career Spine 八幕序列保持不變", evaluate(context, "CareerSpineContract.getCareerSpineSnapshot(Object.assign(createInitialPlayer('c'), { chapter: '青棒第二年', age: 17, highSchoolYearTwoStep: 2 })).underlyingEventIds[0]") === "high_school_year_two_spring_game");
verify("訓練 Resolver 未依賴 DOM、全域 Player、Save 或 Story", !fs.readFileSync(path.join(root, "baseball-training-resolver.js"), "utf8").match(/document|localStorage|\bplayer\s*\.|getEvent|saveGame/));

console.log(`\nGameplay Sprint 5.5 Training Rhythm：${passed}/${passed} 通過`);
