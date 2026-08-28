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
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        id, innerHTML: "", textContent: "", value: id === "nameInput" ? "整合測試球員" : "",
        style: {}, dataset: {}, disabled: false,
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
      });
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console, document, module: { exports: {} },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout(callback) { callback(); } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

const rollA = parse("rollCharacterGenesis(() => 0.25)");
const rollB = parse("rollCharacterGenesis(() => 0.25)");
verify("1. 注入相同 RNG 會得到相同初始能力形狀", JSON.stringify(rollA) === JSON.stringify(rollB));
verify("2. 初始擲骰固定總量 12 且每項只在 1–3", rollA.total === 12 && Object.values(rollA.baseRoll).every(value => value >= 1 && value <= 3));
verify("3. 配置點固定 3 且單項上限 2", evaluate("validateCharacterGenesisAllocation({ballSense:2,observe:1}).ok && !validateCharacterGenesisAllocation({ballSense:3}).ok"));
verify("4. 創角介面會把能力 key 轉成玩家可讀名稱", evaluate("formatCharacterGenesisShape('baseRunning＋baseballIQ') === '跑壘＋棒球理解'"));

verify("5. 正式創角會保存 archetype、能力形狀、配置、投打與最初願望", evaluate(`(() => {
  player=createInitialPlayer("Genesis"); player.origin="understand"; player.idealSelf="技巧型";
  const roll=rollCharacterGenesis(()=>0.25);
  const result=applyCharacterGenesis(player,{baseRoll:roll.baseRoll,allocation:{ballSense:2,observe:1},shape:roll.shape,bats:"S",throws:"L"});
  return result.ok && player.characterGenesis.completed && player.characterGenesis.total===15 && player.characterGenesis.archetype==="技巧型" && player.characterGenesis.initialAspiration==="understand" && player.bats==="S" && player.throws==="L";
})()`));

verify("6. canonical 守位是唯一寫入來源，舊欄位只做相容映射", evaluate(`(() => {
  player=createInitialPlayer("Position"); applyCanonicalPositionProfile(player,"捕手",["內野手","外野手"]);
  const first=player.seasonPosition==="捕手" && player.secondaryPosition==="內野手" && player.secondaryPositions.length===1;
  player.seasonPosition="投手"; player.secondaryPosition="外野手";
  return first && player.primaryPosition==="投手" && player.secondaryPositions.join() === "外野手";
})()`));

const alignmentKinds = parse(`(() => {
  const cases=[];
  player=createInitialPlayer("一致"); player.idealSelf="強打型"; player.baseballSkills.batting=12; player.ballSense=8; cases.push(getHighSchoolIdealAlignment({rating:3}).idealAlignment);
  player=createInitialPlayer("部分"); player.idealSelf="速度型"; Object.assign(player.baseballSkills,{batting:8,baseRunning:7}); Object.assign(player,{ballSense:4,fitness:4}); cases.push(getHighSchoolIdealAlignment({rating:3}).idealAlignment);
  player=createInitialPlayer("衝突"); player.idealSelf="速度型"; player.baseballSkills.batting=15; player.ballSense=10; cases.push(getHighSchoolIdealAlignment({rating:3}).idealAlignment);
  return cases;
})()`);
verify("7. 理想自我與教練評估可產生一致／部分一致／衝突", new Set(alignmentKinds).size === 3 && ["一致", "部分一致", "衝突"].every(kind => alignmentKinds.includes(kind)));

const roleCodes = parse(`(() => {
  const resolve=(level)=>{
    player=createInitialPlayer(level); player.primaryPosition="內野手"; player.highSchoolCoachEvaluation.rating=level==="starter"?35:level==="rotation"?20:2;
    if(level!=="bench") Object.assign(player.baseballSkills,{catching:8,throwing:8,reaction:8,range:8,baseballIQ:8});
    player.relationships.coachTrust=level==="starter"?8:level==="rotation"?6:0; player.seasonPerformance=level==="starter"?3:0;
    addFlags(["hs_role_strengthen_primary"]); return resolveHighSchoolProvisionalRole().code;
  }; return [resolve("starter"),resolve("rotation"),resolve("bench")];
})()`);
verify("8. 複合判定可形成先發／輪替／發展三種內部角色", JSON.stringify(roleCodes) === JSON.stringify(["starter", "rotation", "bench"]));

const roleMatches = parse(`(() => ["starter","rotation","bench"].map(code=>{
  player=createRepresentativeHighSchoolEntryFixture("ordinary",11000+["starter","rotation","bench"].indexOf(code)); player.highSchoolRoleCode=code; player.highSchoolTeamRole=code;
  const match=prepareHighSchoolYearOneMatch(); return {code,id:match.id,opponent:match.opponent,assignment:match.assignment};
}))()`);
verify("9. 三種角色都進入同一場正式交流賽", roleMatches.every(item => item.id === "hs-y1-autumn-exhibition" && item.opponent.includes("高橋") && item.assignment));

const abilityOutcomes = parse(`(() => {
  const run=high=>{ player=createRepresentativeHighSchoolEntryFixture(high?"defense":"low",high?11102:11101); player.highSchoolRoleCode="bench";
    if(high) Object.assign(player.baseballSkills,{batting:14,baseballIQ:10}); if(high) Object.assign(player,{ballSense:10,observe:8,discipline:8});
    pendingHighSchoolMatchSimulationSeed=high?11102:11101;
    const texts=[];let safety=0;while(!player.highSchoolMatch.completed&&safety++<1400){
      const match=prepareHighSchoolYearOneMatch();
      if(isHighSchoolMatchDecisionVisible(match)){const choices=getHighSchoolYearOneMatchMomentChoices(match);const preferred=match.currentDomain==="defense"?"secure":"zone";const choice=choices.find(item=>item.matchDecision===preferred)||choices[0];texts.push(resolveHighSchoolYearOneMatch(choice.matchDecision,choice.matchMomentId,()=>high?0.99:0));}
      else advanceHighSchoolMatchPlaybackStep(match);
    }
    return {text:texts.join("｜"),completed:player.highSchoolMatch.completed,id:player.highSchoolMatch.id,moments:player.highSchoolMatch.completedMoments.length}; };
  return [run(false),run(true)];
})()`);
verify("10. 能力會改變場上結果，但 Regulation 只決定一至三次合法決策", abilityOutcomes.every(item => item.completed && item.moments >= 1 && item.moments <= 3 && item.id === "hs-y1-autumn-exhibition") && abilityOutcomes[0].text !== abilityOutcomes[1].text);

const azheVariants = parse(`(() => {
  const run=(kind)=>{ player=createInitialPlayer(kind); player.idealSelf="棒球理解型";
    if(kind==="player") { player.impression.azhe.trusts=8; player.relationships.teammateBond=8; player.observe=8; player.baseballSkills.baseballIQ=10; addFlags(["azhe_error_reworked"]); }
    if(kind==="shared") { player.relationships.teammateBond=5; addFlags(["azhe_hidden_error_seen"]); }
    return resolveHighSchoolAzheEcho().variant; };
  return [run("player"),run("shared"),run("azhe")];
})()`);
verify("11. 阿哲複合證據可形成玩家影響／共同發現／阿哲影響三種回聲", JSON.stringify(azheVariants) === JSON.stringify(["player-guides", "co-discovery", "azhe-guides"]));

const rivalEntries = parse(`(() => ["starter","rotation","bench"].map(code=>{player=createInitialPlayer(code);player.highSchoolRoleCode=code;return prepareHighSchoolRivalPressure().entryType;}))()`);
verify("12. 角色敏感的高橋入口為 direct／limited／observed", JSON.stringify(rivalEntries) === JSON.stringify(["direct", "limited", "observed"]));

verify("13. 錯誤、過期與重複事件提交都保持零狀態變化", evaluate(`(() => {
  player=createInitialPlayer("Guard"); player.chapter="青棒"; player.highSchoolStep=0;
  const before=JSON.stringify(player); const wrong=choose("high_school_load",0); const wrongStable=before===JSON.stringify(player) && wrong===false;
  choose("high_school_intro",0); const after=JSON.stringify(player); const repeated=choose("high_school_intro",0);
  return wrongStable && repeated===false && after===JSON.stringify(player) && player.highSchoolStep===1;
})()`));

verify("14. 高二入口會拒絕未完成第一年的快照", evaluate(`(() => { player=createInitialPlayer("Gate"); player.chapter="青棒第一年小結"; player.highSchoolStep=8; const before=JSON.stringify(player); return enterHighSchoolYearTwo()===false && JSON.stringify(player)===before; })()`));
verify("15. 高二入口只接受已結算且有正式比賽證明的第一年", evaluate(`(() => { player=createInitialPlayer("GateOK"); player.chapter="青棒第一年小結"; player.highSchoolStep=8; player.highSchoolYearOneComplete=true; player.highSchoolMatch.completed=true; return enterHighSchoolYearTwo()===true && player.chapter==="青棒第二年" && player.age===17; })()`));

verify("16. v12 高一小結會遷移到 v15 canonical profile 並保留高二相容入口", evaluate(`(() => {
  const old={saveVersion:12,name:"Legacy",chapter:"青棒第一年小結",age:16,seasonPosition:"捕手",secondaryPosition:"內野手",highSchoolResult:"舊結果",highSchoolDetail:"舊內容"};
  const migrated=normalizeSave(old); return migrated.saveVersion===15 && migrated.primaryPosition==="捕手" && migrated.secondaryPositions[0]==="內野手" && migrated.highSchoolYearOneComplete && migrated.highSchoolMatch.completed && migrated.highSchoolStep===8;
})()`));

console.log(`\nHigh School Integration 1.1：${passed}/${passed} 通過`);
