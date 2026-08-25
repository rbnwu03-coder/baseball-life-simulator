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
  "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const timers = new Map();
  let nextTimerId = 1;
  const continueButton = { disabled: false, setAttribute() {}, removeAttribute() {} };
  const context = vm.createContext({
    console: { log() {}, warn() {}, error: console.error }, module: { exports: {} }, URLSearchParams,
    navigator: { clipboard: { async writeText(value) { context.__clipboard = value; } } },
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {} },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } });
        return nodes.get(id);
      },
      querySelector(selector) {
        if (selector === "#choices .outcome-continue-button") return continueButton;
        if (selector === "#outcomeTitle") return this.getElementById("outcomeTitle");
        return null;
      },
      querySelectorAll() { return []; },
      createElement() { return { value: "", style: {}, setAttribute() {}, select() {}, remove() {} }; }, execCommand() { return true; }
    },
    localStorage: { setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); } },
    window: {
      location: { search: "" },
      setTimeout(callback, delay) { const id = nextTimerId++; timers.set(id, { callback, delay }); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    __clearTimers() { timers.clear(); }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __mdResult(skill, options={}) {
      return Object.assign({
        settlementId:"match-fixture|"+skill, sourceType:"gameExperience", targetSkill:skill,
        skillBefore:5, skillAfter:5, progressBefore:20, progressGained:15, progressAfter:35,
        levelUps:0, skillCapReached:false, learningQuality:"good"
      },options);
    }
    function __mdEvidence(skill, options={}) {
      return Object.assign({
        evidenceId:"e-"+skill, matchId:"match-fixture", playId:"play-"+skill, playerId:"player",
        evidenceType:"active", activeType:"execution", participationType:skill==="batting"?"batter":"primaryFielder", role:skill==="batting"?"batter":"initiator",
        decisionEvidence:{quality:"acceptable",opportunity:true,reasons:[]},
        executionEvidence:{quality:"normal",stages:{}}, outcomeEvidence:{result:"out"},
        difficulty:"appropriate", novelty:{semanticKey:skill+"|routine",occurrence:1,modifier:1}, pressure:{band:"normal",modifier:1.02,reasons:[]},
        experienceQuality:"normal", skillEvidence:{targetSkill:skill,component:"execution",baseValue:1.75,adjustedValue:1.75},
        attribution:{primaryCause:"",secondaryCause:"",responsibleActor:"player"}, sourceSnapshot:{type:"fixture"}
      },options);
    }
    function __mdContext(skill, quality="normal") {
      return {sourceType:"gameExperience",sourceId:"match-fixture|"+skill,settlementId:"match-fixture|"+skill,targetSkill:skill,activityType:"technical",difficulty:"appropriate",quality:"standard",playerChoice:"match-experience:"+skill,developmentBias:"ideal-self",metadata:{experienceQuality:quality,reasons:[]}};
    }
    function __mdMatch(options={}) {
      const skills=options.skills||["batting"];
      const evidence=options.evidence||skills.map(skill=>__mdEvidence(skill));
      const results=options.results||skills.map(skill=>__mdResult(skill));
      return {id:"match-fixture",completed:true,matchExperience:{version:"match-experience-development-v1",settled:options.settled!==false,matchExperienceSettlementId:"match-fixture|player|match-experience-development-v1",exposure:Object.assign({defensiveInnings:2,plateAppearances:2},options.exposure||{}),evidence,selectedContexts:(options.contexts||skills.map(skill=>__mdContext(skill,options.quality||"normal"))),developmentResults:results}};
    }
    function __mdModel(match) { return MatchDevelopmentSettlementPresentation.createViewModel(match,{skillLabels}); }
    function __prepareDirectMatch(seed=553101) {
      stopHighSchoolMatchPlayback("presentation-reset");__clearTimers();pendingYouthSeasonOutcome=null;isTransitioning=false;resetGame();
      setHighSchoolMatchOpportunityDebugEnabled(true);
      document.getElementById("nameInput").value="Settlement Presentation 球員";
      selectOrigin(PlayerIdentityOptions.origins[1]);selectIdealSelf("棒球理解型");
      pendingGenesisRoll=rollCharacterGenesis(()=>.25);
      pendingGenesisAllocation={ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1};
      selectDevelopmentEntry("highSchoolFullMatch");selectDevelopmentTestPosition("二壘手");pendingHighSchoolMatchSimulationSeed=seed;createPlayer();
      stopHighSchoolMatchPlayback("presentation-direct");__clearTimers();
      const match=player.highSchoolMatch;let guard=0;
      while(!match.completed&&guard++<5000){
        if(hasBlockingHighSchoolMatchOutcome()){continueYouthSeasonOutcome();stopHighSchoolMatchPlayback("presentation-intermediate");__clearTimers();}
        else if(isHighSchoolMatchDecisionVisible(match)){const choice=getHighSchoolYearOneMatchMomentChoices(match)[0];chooseHighSchoolYearOneMatchMoment(choice.matchDecision,choice.matchMomentId,()=>.82);stopHighSchoolMatchPlayback("presentation-choice");__clearTimers();}
        else {advanceHighSchoolMatchPlaybackStep(match);stopHighSchoolMatchPlayback("presentation-step");__clearTimers();}
      }
      if(!pendingYouthSeasonOutcome)showHighSchoolCompletedMatchOutcome(match);
      return match;
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

verify("1. Presentation 使用獨立 v1 contract 且在 script.js 前載入", evaluate(`MatchDevelopmentSettlementPresentation.VERSION==="match-development-settlement-presentation-v1"`) && fs.readFileSync(path.join(root,"index.html"),"utf8").indexOf("match-development-settlement-presentation.js") < fs.readFileSync(path.join(root,"index.html"),"utf8").indexOf("script.js"));

const progressOnly = parse(`(()=>{const m=__mdMatch({skills:["batting"]});const before=JSON.stringify(m);const model=__mdModel(m);const html=MatchDevelopmentSettlementPresentation.render(model);return {model,html,unchanged:before===JSON.stringify(m)};})()`);
verify("2. Progress-only 顯示實戰累積但不假裝 level-up", progressOnly.html.includes("已有實戰累積，但尚未形成永久能力提升") && !progressOnly.html.includes("5 → 6"));
verify("3. 正常 UI 不顯示 raw progress／seed／multiplier／XP", !/progress|seed|multiplier|XP|經驗值\s*\+|\+15/.test(progressOnly.html));
verify("4. Presentation create／render 完全 read-only", progressOnly.unchanged);

const levelUp = parse(`(()=>{const m=__mdMatch({results:[__mdResult("batting",{skillAfter:6,progressBefore:91,progressAfter:6,levelUps:1})]});const model=__mdModel(m);return {model,html:MatchDevelopmentSettlementPresentation.render(model)};})()`);
verify("5. Level-up 明確顯示玩家可讀 Skill before → after", levelUp.html.includes("打擊") && levelUp.html.includes("5 → 6"));
const multiLevel = evaluate(`MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({results:[__mdResult("batting",{skillAfter:7,levelUps:2})]}))).includes("5 → 7")`);
verify("6. Multi-level 不假設 levelUps 只能為 1", multiLevel);
const cap = evaluate(`MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({results:[__mdResult("batting",{skillBefore:20,skillAfter:20,progressGained:0,levelUps:0,skillCapReached:true})]})))`);
verify("7. Skill cap 顯示最高成熟度且不出現 20 → 21", cap.includes("最高成熟度") && !cap.includes("20 → 21"));

const failureLearning = evaluate(`(()=>{const evidence=[__mdEvidence("baseballIQ",{decisionEvidence:{quality:"strong",opportunity:true,reasons:[]},executionEvidence:{quality:"weak",stages:{}},outcomeEvidence:{result:"safe"}})];return MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({skills:["baseballIQ"],evidence,quality:"valuable"})));})()`);
verify("8. Strong decision＋weak execution＋failed outcome 呈現分離語意", failureLearning.includes("讀對了局面") && failureLearning.includes("執行仍有修正空間"));
verify("9. Failure learning 不會被寫成失敗所以沒有學習", !failureLearning.includes("失敗所以沒有") && failureLearning.includes("明顯的學習"));

const rescuedOutcome = evaluate(`(()=>{const evidence=[__mdEvidence("baseballIQ",{decisionEvidence:{quality:"poor",opportunity:true,reasons:[]},executionEvidence:{quality:"strong",stages:{}},outcomeEvidence:{result:"singleOut"}})];return MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({skills:["baseballIQ"],evidence})));})()`);
verify("10. Poor decision＋successful execution 不誇稱判斷出色", rescuedOutcome.includes("執行成功救回") && !rescuedOutcome.includes("判斷非常出色"));

const lowSuccess = evaluate(`MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({skills:["batting"],quality:"low",evidence:[__mdEvidence("batting",{difficulty:"easy",novelty:{semanticKey:"routine",occurrence:7,modifier:.23},outcomeEvidence:{result:"hit"}})]})))`);
verify("11. Routine success＋low novelty 不誇張成重大突破", lowSuccess.includes("熟悉與維持") && !lowSuccess.includes("重大實戰突破"));

const exposureOnly = parse(`(()=>{const evidence=[__mdEvidence("baseballIQ",{evidenceType:"exposure",activeType:"none",participationType:"cover",playId:"defensive-innings",decisionEvidence:{quality:"none",opportunity:false,reasons:[]},executionEvidence:{quality:"notApplicable",stages:{}}})];const m=__mdMatch({skills:["baseballIQ"],exposure:{defensiveInnings:7,plateAppearances:0},evidence,quality:"low"});const model=__mdModel(m);return {model,html:MatchDevelopmentSettlementPresentation.render(model)};})()`);
verify("12. Exposure-only 顯示局面熟悉而非 active skill breakthrough", exposureOnly.html.includes("局面熟悉度") && !/傳球.*→|接球.*→|反應.*→/.test(exposureOnly.html));
verify("13. 本場參與顯示實際守備局數／PA／守備處理而非 evidence count", exposureOnly.html.includes("7 局") && exposureOnly.html.includes("守備處理") && exposureOnly.model.participation.defensivePlays === 0 && !exposureOnly.html.includes("evidence"));

const bench = evaluate(`MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({skills:[],contexts:[],results:[],evidence:[],exposure:{defensiveInnings:0,plateAppearances:0}})))`);
verify("14. Bench 0 participation 顯示無直接實戰成長", bench.includes("沒有實際上場") && bench.includes("沒有形成直接的實戰成長"));
const playedNoContext = evaluate(`MatchDevelopmentSettlementPresentation.render(__mdModel(__mdMatch({skills:[],contexts:[],results:[],evidence:[],exposure:{defensiveInnings:2,plateAppearances:1}})))`);
verify("15. Played but 0 context 有合法非空白文案", playedNoContext.includes("沒有形成明顯的新技能成長") && !/undefined|\[object Object\]/.test(playedNoContext));

const maxThree = parse(`(()=>{const skills=["batting","baseballIQ","throwing","catching"];const model=__mdModel(__mdMatch({skills}));return {model,html:MatchDevelopmentSettlementPresentation.render(model)};})()`);
verify("16. 異常超過 3 contexts 時正常 UI 最多依既有順序顯示 3", maxThree.model.learning.length === 3 && maxThree.model.contextOverflow && !maxThree.html.includes("接球"));
verify("17. Model 與巢狀資料 deep frozen", evaluate(`(()=>{const m=__mdModel(__mdMatch());return Object.isFrozen(m)&&Object.isFrozen(m.learning)&&Object.isFrozen(m.learning[0]);})()`));

const legacy = evaluate(`MatchDevelopmentSettlementPresentation.render(__mdModel({id:"legacy",completed:true,matchExperience:null}))`);
verify("18. No-Match-Experience legacy state 不 crash 且顯示中性訊息", legacy.includes("未產生可結算的實戰成長資料"));
verify("19. Legacy completed save migration 可 bypass 已看過的舊 outcome", evaluate(`(()=>{const saved=Object.assign(createInitialPlayer("Legacy"),{highSchoolMatch:Object.assign(createInitialPlayer().highSchoolMatch,{completed:true,eventSettlementApplied:true})});delete saved.highSchoolMatch.developmentPresentationCompleted;return normalizeSave(saved).highSchoolMatch.developmentPresentationCompleted===true;})()`));

const repeatedRender = evaluate(`(()=>{const m=__mdMatch();const before=JSON.stringify(m);for(let i=0;i<10;i++)MatchDevelopmentSettlementPresentation.render(__mdModel(m));return before===JSON.stringify(m);})()`);
verify("20. Render 1 次與 10 次都不修改 Settlement／Development truth", repeatedRender);
verify("21. HTML 使用 semantic headings 與三層 aria-labelledby structure", ["matchDevelopmentTitle","matchParticipationTitle","matchLearningTitle","matchBreakthroughTitle"].every(id => progressOnly.html.includes(`id="${id}"`) && progressOnly.html.includes(`aria-labelledby="${id}"`)));
const css = fs.readFileSync(path.join(root,"style.css"),"utf8");
verify("22. Settlement reuse outcome card 並具 390px／200% zoom 安全縮排", css.includes(".match-development-settlement") && css.includes("@media (max-width: 900px)") && css.includes("overflow-wrap:anywhere"));

const direct = parse(`(()=>{const match=__prepareDirectMatch();const model=__mdModel(match);return {completed:match.completed,settled:match.matchExperience?.settled,presentationCompleted:match.developmentPresentationCompleted,pending:pendingYouthSeasonOutcome?.eventId||"",html:document.getElementById("story").innerHTML,choices:document.getElementById("choices").innerHTML,model};})()`);
verify("23. Direct Start Match End → Experience／Development settled → Presentation", direct.completed && direct.settled && !direct.presentationCompleted && direct.pending === "high_school_showcase" && direct.html.includes("本場實戰成長"));
verify("24. Direct Start 不需 Normal School Choice 且顯示三層玩家摘要", ["本場參與","本場主要實戰經驗","能力成長結果"].every(text => direct.html.includes(text)));
verify("25. Continue 是可鍵盤操作的 semantic button 並沿用 focus class", direct.choices.includes('<button type="button"') && direct.choices.includes("outcome-continue-button"));

const renderIdempotency = evaluate(`(()=>{const before=JSON.stringify(player.developmentState);for(let i=0;i<10;i++)renderHighSchoolPostMatchOutcome({},"");return before===JSON.stringify(player.developmentState);})()`);
verify("26. Production render 10 次不重套 Development", renderIdempotency);

const reload = parse(`(()=>{const summaryBefore=JSON.stringify(__mdModel(player.highSchoolMatch));const developmentBefore=JSON.stringify(player.developmentState);const settlementId=player.highSchoolMatch.matchExperience.matchExperienceSettlementId;saveGame();loadGame();const summaryAfter=JSON.stringify(__mdModel(player.highSchoolMatch));const developmentAfter=JSON.stringify(player.developmentState);const beforeDuplicate=JSON.stringify(player.developmentState);const duplicate=MatchExperienceDevelopment.settleMatchExperienceDevelopment(player,player.highSchoolMatch);return {sameSummary:summaryBefore===summaryAfter,sameDevelopment:developmentBefore===developmentAfter,sameSettlement:settlementId===player.highSchoolMatch.matchExperience.matchExperienceSettlementId,presentationCompleted:player.highSchoolMatch.developmentPresentationCompleted,pending:pendingYouthSeasonOutcome?.eventId||"",screen:document.getElementById("story").innerHTML,duplicateStatus:duplicate.status,noDuplicate:beforeDuplicate===JSON.stringify(player.developmentState)};})()`);
verify("27. Save/reload 仍停在同一 Settlement Presentation", reload.sameSummary && !reload.presentationCompleted && reload.pending === "high_school_showcase" && reload.screen.includes("本場實戰成長"));
verify("28. Reload 保持相同 progress／skill／settlement ID", reload.sameDevelopment && reload.sameSettlement);
verify("29. Reload 後再次 settlement 為 duplicate 且 gain 0", reload.duplicateStatus === "duplicate" && reload.noDuplicate);

const doubleContinue = parse(`(()=>{const beforeStep=player.highSchoolStep;const first=continueYouthSeasonOutcome();const afterFirstEvent=getCurrentEventId();const afterFirstStep=player.highSchoolStep;const second=continueYouthSeasonOutcome();return {first,second,beforeStep,afterFirstStep,afterFirstEvent,afterSecondEvent:getCurrentEventId(),completed:player.highSchoolMatch.developmentPresentationCompleted};})()`);
verify("30. Continue 完成 presentation gate 且返回 life route", doubleContinue.first && doubleContinue.completed && doubleContinue.afterFirstEvent);
verify("31. Double Continue 不重複推進或跳過下一事件", doubleContinue.second === false && doubleContinue.afterFirstStep === doubleContinue.beforeStep && doubleContinue.afterSecondEvent === doubleContinue.afterFirstEvent);

const statusSync = parse(`(()=>{const match=player.highSchoolMatch;match.matchExperience.selectedContexts=[__mdContext("batting","valuable")];match.matchExperience.developmentResults=[__mdResult("batting",{skillAfter:6,progressBefore:91,progressAfter:6,levelUps:1})];match.developmentPresentationCompleted=false;player.baseballSkills.batting=6;renderHighSchoolPostMatchOutcome({},"");updateStatus();return {story:document.getElementById("story").innerHTML,status:document.getElementById("status").innerHTML};})()`);
verify("32. Level-up Presentation 與 Status Panel 在 Continue 前同步為 6", statusSync.story.includes("5 → 6") && statusSync.status.includes("<span>打擊</span><strong>6</strong>"));

verify("33. Debug export 含 exposure／evidence／aggregation／contexts／before-after／settlement ID", evaluate(`(()=>{const d=JSON.parse(exportHighSchoolMatchOpportunityDebug(player.highSchoolMatch)).matchExperience;return d.exposure&&d.evidenceSummary&&d.aggregated&&d.selectedContexts&&d.developmentResults.some(r=>r.skillBefore===5&&r.skillAfter===6)&&d.matchExperienceSettlementId;})()`));
verify("34. Presentation source 不呼叫 applyDevelopmentResult 或 Match Experience settlement", !fs.readFileSync(path.join(root,"match-development-settlement-presentation.js"),"utf8").includes("applyDevelopmentResult(") && !fs.readFileSync(path.join(root,"match-development-settlement-presentation.js"),"utf8").includes("settleMatchExperienceDevelopment("));
verify("35. Catcher 與 Third-Out Match Truth 程式未由 Presentation module 修改", !/catcher|捕手|runnerChanges|third.?out/i.test(fs.readFileSync(path.join(root,"match-development-settlement-presentation.js"),"utf8")));

console.log(`\nMatch Development Settlement Presentation v1：${passed}/${passed} 通過`);
