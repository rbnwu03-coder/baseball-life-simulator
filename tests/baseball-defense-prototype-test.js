const assert = require("assert");
const defense = require("../baseball-defense-prototype.js");

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

function field(overrides = {}) {
  return Object.assign({ ballType: "routine", ballDifficulty: "normal", batterSpeed: "average", fielding: "average", body: "normal", fieldingApproach: "secure" }, overrides);
}

function throwing(overrides = {}) {
  return Object.assign({ scoreState: "tied", runnerSpeed: "average", batterSpeed: "average", controlQuality: "clean", throwDecision: "turn-two" }, overrides);
}

function play(overrides = {}) {
  const value = {
    situation: { ballType: "routine", ballDifficulty: "normal", batterSpeed: "average", runnerSpeed: "average", scoreState: "tied" },
    player: { fielding: "high", throwing: "high", body: "normal" },
    fieldingApproach: "secure",
    throwDecision: "turn-two",
    rolls: { fieldingExecution: 0.5, fieldingResult: 0.5, throwExecution: 0.5, result: 0.5 }
  };
  const result = JSON.parse(JSON.stringify(value));
  Object.entries(overrides).forEach(([key, nested]) => {
    if (nested && typeof nested === "object" && result[key] && typeof result[key] === "object") Object.assign(result[key], nested);
    else result[key] = nested;
  });
  return result;
}

function scoreField(settings, approach) {
  return defense.resolveFieldingDecision(field(Object.assign({}, settings, { fieldingApproach: approach })));
}

function scoreThrow(settings, decision) {
  return defense.resolveThrowDecision(throwing(Object.assign({}, settings, { throwDecision: decision })));
}

function frozen(value) {
  return !value || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(frozen));
}

verify("三個 Ball Acquisition approach IDs 正確", JSON.stringify(defense.FIELDING_APPROACH_IDS) === JSON.stringify(["secure", "attack", "dive"]));
verify("Dive availability 僅開放 range 與 difficult deep grounder", defense.isDiveAvailable("range-ball", "normal") && defense.isDiveAvailable("deep-grounder", "difficult") && !defense.isDiveAvailable("routine", "difficult") && scoreField({}, "dive").status === "unresolved");

const stressA = [
  (() => { const s={ballType:"routine",ballDifficulty:"easy",batterSpeed:"average",fielding:"average",body:"normal"}; const a=scoreField(s,"secure"),b=scoreField(s,"attack"); return a.quality==="excellent"&&a.rawScore>b.rawScore; })(),
  (() => { const s={ballType:"routine",ballDifficulty:"normal",batterSpeed:"fast",fielding:"high",body:"normal"}; return scoreField(s,"secure").rawScore>scoreField(s,"attack").rawScore; })(),
  (() => { const s={ballType:"slow-roller",ballDifficulty:"normal",batterSpeed:"fast",fielding:"high",body:"normal"}; const a=scoreField(s,"attack"); return a.quality==="excellent"&&a.rawScore>scoreField(s,"secure").rawScore; })(),
  (() => { const s={ballType:"slow-roller",ballDifficulty:"normal",batterSpeed:"average",fielding:"average",body:"fatigued"}; return scoreField(s,"secure").rawScore>=scoreField(s,"attack").rawScore; })(),
  (() => { const s={ballType:"slow-roller",ballDifficulty:"difficult",batterSpeed:"fast",fielding:"average",body:"normal"}; return scoreField(s,"attack").rawScore>scoreField(s,"secure").rawScore; })(),
  (() => { const s={ballType:"deep-grounder",ballDifficulty:"normal",batterSpeed:"slow",fielding:"average",body:"normal"}; const a=scoreField(s,"secure"),b=scoreField(s,"attack"); return a.quality==="excellent"&&["poor","bad"].includes(b.quality); })(),
  (() => { const s={ballType:"deep-grounder",ballDifficulty:"difficult",batterSpeed:"fast",fielding:"high",body:"normal"}; return scoreField(s,"dive").rawScore>=scoreField(s,"secure").rawScore&&["poor","bad"].includes(scoreField(s,"attack").quality); })(),
  (() => { const s={ballType:"range-ball",ballDifficulty:"difficult",batterSpeed:"average",fielding:"high",body:"normal"}; const a=scoreField(s,"dive"); return a.quality==="excellent"&&a.rawScore>scoreField(s,"secure").rawScore&&["poor","bad"].includes(scoreField(s,"attack").quality); })(),
  (() => { const healthy=scoreField({ballType:"range-ball",ballDifficulty:"difficult",batterSpeed:"fast",fielding:"high",body:"normal"},"dive"); const tired=scoreField({ballType:"range-ball",ballDifficulty:"difficult",batterSpeed:"fast",fielding:"high",body:"fatigued"},"dive"); return tired.rawScore<healthy.rawScore&&!["poor","bad"].includes(tired.quality); })(),
  (() => { const a=scoreField({ballType:"range-ball",ballDifficulty:"difficult",batterSpeed:"average",fielding:"average",body:"minor-injury"},"dive"); return ["poor","bad"].includes(a.quality); })(),
  (() => { const a=scoreField({ballType:"routine",ballDifficulty:"difficult",batterSpeed:"average",fielding:"high",body:"normal"},"secure"); return a.quality==="excellent"; })(),
  (() => { const s={ballType:"deep-grounder",ballDifficulty:"difficult",batterSpeed:"slow",fielding:"high",body:"minor-injury"}; return scoreField(s,"secure").rawScore>scoreField(s,"dive").rawScore&&scoreField(s,"attack").rawScore<0; })()
];
verify("Stress Test A 的 12 組守備判斷關係成立", stressA.every(Boolean));

const executionTiers = [
  [{ fielding:"low",ballDifficulty:"difficult",body:"minor-injury",decisionQuality:"bad",executionRoll:0.1 },"failed"],
  [{ fielding:"average",ballDifficulty:"normal",body:"normal",decisionQuality:"poor",executionRoll:0.5 },"poor"],
  [{ fielding:"average",ballDifficulty:"normal",body:"normal",decisionQuality:"neutral",executionRoll:0.5 },"playable"],
  [{ fielding:"high",ballDifficulty:"normal",body:"normal",decisionQuality:"good",executionRoll:0.5 },"good"],
  [{ fielding:"high",ballDifficulty:"easy",body:"normal",decisionQuality:"excellent",executionRoll:0.9 },"excellent"]
];
verify("Fielding execution tier mapping 正確", executionTiers.every(([input,tier])=>defense.resolveFieldingExecution(input).tier===tier));
verify("Fielding excellent 具有 skill gate", defense.resolveFieldingExecution({fielding:"average",ballDifficulty:"easy",body:"normal",decisionQuality:"excellent",executionRoll:0.9}).tier==="good");

const failed = defense.resolveDefensivePlay(play({ player:{fielding:"low",throwing:"elite",body:"minor-injury"}, situation:{ballDifficulty:"difficult"}, rolls:{fieldingExecution:0.1,fieldingResult:0.1,throwExecution:0.9,result:0.1} }));
verify("Fielding failed 會停止 Throw stage", failed.status==="resolved"&&failed.control.quality==="failed"&&failed.throwDecision.status==="unavailable"&&failed.throwExecution===null);

const controls = [
  [{fielding:"high",ballDifficulty:"normal",body:"normal",decisionQuality:"excellent",executionRoll:0.5},"clean"],
  [{fielding:"average",ballDifficulty:"normal",body:"normal",decisionQuality:"neutral",executionRoll:0.5},"delayed"],
  [{fielding:"average",ballDifficulty:"normal",body:"normal",decisionQuality:"poor",executionRoll:0.5},"off-balance"]
];
verify("Execution 正確映射 clean／delayed／off-balance", controls.every(([input,control])=>defense.resolveFieldingExecution(input).controlQuality===control));
verify("三個 Throw Decision IDs 正確", JSON.stringify(defense.THROW_DECISION_IDS)===JSON.stringify(["secure-first","force-lead-runner","turn-two"]));

const stressB = [
  (()=>{const s={scoreState:"tied",runnerSpeed:"average",batterSpeed:"average",controlQuality:"clean"};return scoreThrow(s,"turn-two").rawScore>=Math.max(scoreThrow(s,"secure-first").rawScore,scoreThrow(s,"force-lead-runner").rawScore);})(),
  (()=>{const s={scoreState:"ahead-1",runnerSpeed:"fast",batterSpeed:"slow",controlQuality:"clean"};const f=scoreThrow(s,"force-lead-runner").rawScore;return f>scoreThrow(s,"secure-first").rawScore&&f>=scoreThrow(s,"turn-two").rawScore;})(),
  (()=>{const s={scoreState:"behind-1",runnerSpeed:"slow",batterSpeed:"slow",controlQuality:"clean"};const t=scoreThrow(s,"turn-two").rawScore;return t>scoreThrow(s,"secure-first").rawScore&&t>scoreThrow(s,"force-lead-runner").rawScore;})(),
  (()=>{const s={scoreState:"tied",runnerSpeed:"fast",batterSpeed:"fast",controlQuality:"clean"};const t=scoreThrow(s,"turn-two").rawScore;return t<scoreThrow(s,"secure-first").rawScore&&t<scoreThrow(s,"force-lead-runner").rawScore;})(),
  ["poor","bad"].includes(scoreThrow({scoreState:"ahead-1",runnerSpeed:"fast",batterSpeed:"average",controlQuality:"delayed"},"turn-two").quality),
  (()=>{const s={scoreState:"tied",runnerSpeed:"slow",batterSpeed:"fast",controlQuality:"delayed"};return scoreThrow(s,"secure-first").rawScore>=scoreThrow(s,"force-lead-runner").rawScore&&scoreThrow(s,"turn-two").rawScore<0;})(),
  scoreThrow({scoreState:"behind-1",runnerSpeed:"slow",batterSpeed:"average",controlQuality:"clean"},"turn-two").rawScore>0,
  (()=>{const s={scoreState:"ahead-1",runnerSpeed:"fast",batterSpeed:"slow",controlQuality:"off-balance"};return scoreThrow(s,"secure-first").rawScore>scoreThrow(s,"turn-two").rawScore&&scoreThrow(s,"turn-two").quality==="bad";})(),
  (()=>{const s={scoreState:"tied",runnerSpeed:"average",batterSpeed:"slow",controlQuality:"clean"};return scoreThrow(s,"turn-two").rawScore>scoreThrow(s,"secure-first").rawScore;})(),
  ["poor","bad"].includes(scoreThrow({scoreState:"ahead-1",runnerSpeed:"fast",batterSpeed:"fast",controlQuality:"delayed"},"turn-two").quality),
  (()=>{const s={scoreState:"behind-1",runnerSpeed:"average",batterSpeed:"average",controlQuality:"off-balance"};return scoreThrow(s,"secure-first").rawScore>scoreThrow(s,"turn-two").rawScore;})(),
  (()=>{const s={scoreState:"tied",runnerSpeed:"fast",batterSpeed:"slow",controlQuality:"clean"};const f=scoreThrow(s,"force-lead-runner").rawScore;return f>=scoreThrow(s,"turn-two").rawScore&&f>scoreThrow(s,"secure-first").rawScore;})()
];
verify("Stress Test B 的 12 組傳球判斷關係成立", stressB.every(Boolean));

const fastFast = defense.throwResultDistribution({throwDecision:"turn-two",runnerSpeed:"fast",batterSpeed:"fast",controlQuality:"clean"},"excellent");
verify("Fast/Fast 即使 excellent 仍抑制雙殺且不保證成功", fastFast["double-play"]<50&&fastFast["force-out-second"]>0);
const clean = defense.throwResultDistribution({throwDecision:"turn-two",runnerSpeed:"average",batterSpeed:"average",controlQuality:"clean"},"good");
const delayed = defense.throwResultDistribution({throwDecision:"turn-two",runnerSpeed:"average",batterSpeed:"average",controlQuality:"delayed"},"good");
const offBalance = defense.throwResultDistribution({throwDecision:"turn-two",runnerSpeed:"average",batterSpeed:"average",controlQuality:"off-balance"},"good");
verify("Clean control 建立雙殺窗口", clean["double-play"]===50);
verify("Delayed control 降低雙殺窗口", delayed["double-play"]<clean["double-play"]);
verify("Off-balance 強烈抑制雙殺", offBalance["double-play"]<delayed["double-play"]);
verify("快前位跑者加慢打者讓封殺二壘具有獨立價值", scoreThrow({runnerSpeed:"fast",batterSpeed:"slow",controlQuality:"clean"},"force-lead-runner").quality==="excellent");
verify("高傳球能力不會修復壞策略判斷", scoreThrow({runnerSpeed:"fast",batterSpeed:"fast",controlQuality:"delayed"},"turn-two").quality==="bad");

const healthyExecution=defense.resolveThrowExecution({throwing:"high",controlQuality:"clean",body:"normal",decisionQuality:"excellent",executionRoll:0.5});
const tiredExecution=defense.resolveThrowExecution({throwing:"high",controlQuality:"clean",body:"fatigued",decisionQuality:"excellent",executionRoll:0.5});
verify("疲勞主要降低 Execution 而非 Decision Quality", tiredExecution.score===healthyExecution.score-1);

const deterministic=play();
verify("相同防守 input 與 rolls deterministic",JSON.stringify(defense.resolveDefensivePlay(deterministic))===JSON.stringify(defense.resolveDefensivePlay(deterministic)));
verify("非法防守 enum fail closed",defense.resolveDefensivePlay(play({fieldingApproach:"teleport"})).status==="unresolved");
const before=JSON.stringify(deterministic); defense.resolveDefensivePlay(deterministic);
verify("防守 Resolver 不修改 input",JSON.stringify(deterministic)===before);
verify("防守 resolved result 完整 deep frozen",frozen(defense.resolveDefensivePlay(deterministic)));

console.log(`\nGameplay Sprint 5.1 Defensive Prototype：${passed}/${passed} 通過`);
