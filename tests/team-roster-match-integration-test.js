const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "pitcher-catcher-tactical-integration.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "batted-ball-tag-up-execution.js", "match-situation-lifecycle.js",
  "plate-decision-foundation.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "team-roster-foundation.js", "team-strength-model.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console: { log() {}, warn() {}, error: console.error }, module: { exports: {} },
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } }); return nodes.get(id); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); } },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);

evaluate(`
  function __rosterSetup(role="starter", seed=61001) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Roster 整合球員"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"游擊手",["二壘手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode=role; player.highSchoolTeamRole=role;
    pendingHighSchoolMatchSimulationSeed=seed; return prepareHighSchoolYearOneMatch();
  }
  function __simulateStrengthGame(seed) {
    const match=__rosterSetup("bench",70000+seed);
    const strong=TeamRosterFoundation.generateTeamRoster({teamId:"strong",schoolStandard:"powerhouse",yearIdentity:2026,seed:"strong-roster"});
    const weak=TeamRosterFoundation.generateTeamRoster({teamId:"weak",schoolStandard:"development",yearIdentity:2026,seed:"weak-roster"});
    match.rosters={away:TeamRosterFoundation.toMatchRoster(strong,TeamStrengthModel.deriveTeamStrengthProfile(strong)),home:TeamRosterFoundation.toMatchRoster(weak,TeamStrengthModel.deriveTeamStrengthProfile(weak))};
    Object.assign(match,{scores:{home:0,away:0},battingOrderIndex:{home:0,away:0},playerEntryCompleted:true,playerLineupStatus:"unavailable",completed:false});
    const random=TeamRosterFoundation.createSeededRandom("game|"+seed);
    for(let inning=1;inning<=7;inning+=1){
      for(const team of ["away","home"]){
        Object.assign(match,{inning,half:team==="away"?"上":"下",offenseTeam:team,defenseTeam:team==="away"?"home":"away",outs:0,runners:[null,null,null]});
        match.currentBatter=getHighSchoolMatchLineupBatter(match,team).id;
        let safety=0;
        while(match.outs<3&&safety++<100) resolveSimulatedHighSchoolPlateAppearance(match,random,{allowPlayer:true});
      }
    }
    return {strong:match.scores.away,weak:match.scores.home};
  }
`);

const production = JSON.parse(evaluate(`(() => {const m=__rosterSetup("starter",61001);return JSON.stringify({homeSource:m.rosters.home.source,awaySource:m.rosters.away.source,homeValidation:TeamRosterFoundation.validateRoster(m.rosters.home.teamRoster),awayValidation:TeamRosterFoundation.validateRoster(m.rosters.away.teamRoster),homeCount:m.rosters.home.lineup.length,awayCount:m.rosters.away.lineup.length,player:m.rosters.home.lineup.find(x=>x.id==="player"),profiles:[m.rosters.home.teamStrengthProfile,m.rosters.away.teamStrengthProfile]});})()`));
verify("1. Production match setup 使用 TeamRoster Foundation 而非 legacy roster", production.homeSource === "team-roster-foundation-v1" && production.awaySource === "team-roster-foundation-v1");
verify("2. 注入的 home/away canonical roster 均合法", production.homeValidation.ok && production.awayValidation.ok);
verify("3. Existing Match Engine 仍收到兩隊九人 lineup", production.homeCount === 9 && production.awayCount === 9);
verify("4. 玩家作為單一 roster actor 保留 canonical identity", production.player?.id === "player" && production.player?.source === "canonical-player");
verify("5. Match roster 同時保留 multidimensional team profile", production.profiles.every(profile => profile.lineupQuality && profile.pitchingDepth >= 0 && profile.defenseQuality >= 0));

const pa = JSON.parse(evaluate(`(() => {const m=__rosterSetup("bench",61002);const before=m.battingOrderIndex.away;const batter=getHighSchoolMatchLineupBatter(m,"away");const capability=getOffensiveSimulationCapability(batter);const result=resolveSimulatedHighSchoolPlateAppearance(m,()=>.7);return JSON.stringify({result,before,after:m.battingOrderIndex.away,capability,batterSource:batter.source,log:m.simulationLog.at(-1)});})()`));
verify("6. Generated batter capability 直接進入既有 AI PA simulation", pa.batterSource === "simulation-roster" && pa.capability.contact > 0 && pa.result.batterId && pa.after === (pa.before + 1) % 9);
verify("7. AI PA 仍由既有 settlement 留下 canonical event", pa.log.type === "plateAppearance" && pa.log.batterId === pa.result.batterId);

const pitching = JSON.parse(evaluate(`(() => {const m=__rosterSetup("starter",61003);const pitcher=m.rosters.away.lineup.find(x=>x.position==="投手");const runtime=ensureHighSchoolPitcherRuntimeState(m);return JSON.stringify({pitcherId:pitcher.id,expected:pitcher.pitchingProfile.control*2,runtimeId:runtime.runtimeId,control:runtime.control});})()`));
verify("8. 正式 opposing starter identity 注入 Pitch Sequencing runtime", pitching.runtimeId.includes(pitching.pitcherId));
verify("9. Roster control mapping 進既有 Pitch Control 而未建立第二套 physics", pitching.control === pitching.expected);

const reload = JSON.parse(evaluate(`(() => {const m=__rosterSetup("starter",61004);const before=JSON.parse(JSON.stringify(m.rosters));player=normalizeSave(JSON.parse(JSON.stringify(player)));const after=JSON.parse(JSON.stringify(player.highSchoolMatch.rosters));function firstDiff(a,b,path="root"){if(typeof a!==typeof b)return path+":type";if(a===null||b===null||typeof a!=="object")return a===b?"":path+":"+a+"!="+b;const keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const key of keys){const d=firstDiff(a[key],b[key],path+"."+key);if(d)return d;}return "";}return JSON.stringify({same:JSON.stringify(before)===JSON.stringify(after),diff:firstDiff(before,after)});})()`));
if (!reload.same) console.error(`Roster reload first difference: ${reload.diff}`);
verify("10. Save / Reload 保留 roster、lineup、staff 與 strength truth", reload.same);

const games = JSON.parse(evaluate(`JSON.stringify(Array.from({length:160},(_,index)=>__simulateStrengthGame(index+1)))`));
const strongWins = games.filter(game => game.strong > game.weak).length;
const weakUpsets = games.filter(game => game.weak > game.strong).length;
const strongRuns = games.reduce((sum, game) => sum + game.strong, 0);
const weakRuns = games.reduce((sum, game) => sum + game.weak, 0);
verify("11. Deterministic multi-game fixture 中強 roster 具 expected performance advantage", strongWins > games.length / 2 && strongRuns > weakRuns);
verify("12. 單場 variance 仍允許弱 roster upset", weakUpsets > 0);
verify("13. 模擬沒有 hardcoded guaranteed winner", games.some(game => game.strong === game.weak) || weakUpsets > 0);

const sources = [fs.readFileSync(path.join(root, "team-roster-foundation.js"), "utf8"), fs.readFileSync(path.join(root, "team-strength-model.js"), "utf8"), fs.readFileSync(path.join(root, "script.js"), "utf8")].join("\n");
verify("14. Production 沒有 school tier → winChance flat bonus", !/school(?:Tier|Standard)[^\n]{0,80}(?:winChance|matchBonus|teamPower)/i.test(sources));

console.log(`Team Roster Match Integration tests: ${passed}/14 passed; strong wins ${strongWins}, weak upsets ${weakUpsets}, aggregate runs ${strongRuns}-${weakRuns}.`);
