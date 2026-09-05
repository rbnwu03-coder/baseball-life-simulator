const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const TeamRoster = require("../team-roster-foundation.js");
const EntryRoster = require("../high-school-entry-roster-context.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

const candidateA = EntryRoster.createCandidateSchoolYearContext({ schoolId: "school-a", schoolStandard: "competitive", schoolSeed: "school-a-seed", yearIdentity: "2026-y1" });
const candidateB = EntryRoster.createCandidateSchoolYearContext({ schoolId: "school-a", schoolStandard: "competitive", schoolSeed: "school-a-seed", yearIdentity: "2026-y1" });
verify("1. School-year roster identity deterministic", JSON.stringify(candidateA) === JSON.stringify(candidateB));
verify("2. Identity 包含 school／standard／year／roster seed", candidateA.schoolYearRosterIdentity.schoolId === "school-a" && candidateA.schoolStandard === "competitive" && candidateA.yearIdentity === "2026-y1" && candidateA.rosterGenerationSeed);
verify("3. Candidate base roster 在玩家加入前已存在", TeamRoster.validateRoster(candidateA.baseRoster).ok && !candidateA.baseRoster.players.some(actor => actor.id === "player"));
verify("4. 所有 invitation position need 都由 base roster 形成", EntryRoster.SCHOOL_POSITION_IDS.every(position => EntryRoster.NEED_LEVELS.includes(candidateA.positionNeeds[position])));

function makePositionFixture(starterCapability, benchCapabilities) {
  const roster = JSON.parse(JSON.stringify(TeamRoster.generateTeamRoster({ teamId: `fixture-${starterCapability}-${benchCapabilities.join("-")}`, schoolStandard: "standard", yearIdentity: 2026, seed: 8001 })));
  const position = "SS";
  const starterId = roster.battingOrder.find(slot => slot.defensivePosition === position).playerId;
  const setCapability = (actor, value) => Object.assign(actor, { contact: value, power: value, speed: value, defense: value, arm: value });
  setCapability(roster.players.find(actor => actor.playerId === starterId), starterCapability);
  setCapability(roster.starters.find(actor => actor.playerId === starterId), starterCapability);
  roster.benchPlayers.forEach((actor, index) => {
    actor.primaryPosition = index < benchCapabilities.length ? position : "LF";
    actor.secondaryPositions = [];
    const value = benchCapabilities[index];
    if (value !== undefined) {
      setCapability(actor, value);
      setCapability(roster.players.find(item => item.playerId === actor.playerId), value);
      const playerCopy = roster.players.find(item => item.playerId === actor.playerId);
      playerCopy.primaryPosition = position;
      playerCopy.secondaryPositions = [];
    } else {
      const playerCopy = roster.players.find(item => item.playerId === actor.playerId);
      playerCopy.primaryPosition = "LF";
      playerCopy.secondaryPositions = [];
    }
  });
  return roster;
}

const shallow = makePositionFixture(7.5, []);
const crowded = makePositionFixture(7.5, [7.2, 7, 6.8]);
const shallowCompetition = EntryRoster.deriveCompetitionContext(shallow, "SS", 6.7);
const crowdedCompetition = EntryRoster.deriveCompetitionContext(crowded, "SS", 6.7);
verify("5. 相同強先發下，深 bench 形成更高 competition density", shallowCompetition.competitionDensity !== crowdedCompetition.competitionDensity && crowdedCompetition.competitionDensity === "veryHigh");
verify("6. Competition context 保存 starter／bench actor identities", crowdedCompetition.starterId && crowdedCompetition.benchCompetitorIds.length === 3 && crowdedCompetition.competitorCount === 4);

const supportedBench = makePositionFixture(6, [5.8, 5.7]);
const weakBench = makePositionFixture(6, [4]);
verify("7. 相同 starter 下，弱薄 bench 形成更高 position need", EntryRoster.deriveBasePositionContext(supportedBench, "SS").positionNeed === "medium" && EntryRoster.deriveBasePositionContext(weakBench, "SS").positionNeed === "high");
verify("8. Player 明顯優於 incumbent 時 projected role 可為 starter/core", EntryRoster.projectEntryRole(EntryRoster.deriveCompetitionContext(makePositionFixture(6.1, [5.5, 5.3]), "SS", 7.2)) === "coreCandidate");
verify("9. Player 略低於 incumbent 但高於 bench 時 projected role 為 rotation", EntryRoster.projectEntryRole(EntryRoster.deriveCompetitionContext(makePositionFixture(7.1, [6.2, 6]), "SS", 6.7)) === "rotationCandidate");
verify("10. 深且強的守位群可把玩家 projected role 壓到 bench", EntryRoster.projectEntryRole(EntryRoster.deriveCompetitionContext(makePositionFixture(7.6, [7, 6.9]), "SS", 6.1)) === "benchCandidate");
const strongSchoolBench = makePositionFixture(7.8, [7.2, 7]);
strongSchoolBench.schoolStandard = "powerhouse";
verify("10a. 強校深守位允許高能力球員仍只獲 Bench projection", EntryRoster.projectEntryRole(EntryRoster.deriveCompetitionContext(strongSchoolBench, "SS", 6.2)) === "benchCandidate");
const strongSchoolStarter = makePositionFixture(5.8, [5.2]);
strongSchoolStarter.schoolStandard = "powerhouse";
verify("10b. 強校弱年份允許強球員取得 Starter/Core projection", EntryRoster.projectEntryRole(EntryRoster.deriveCompetitionContext(strongSchoolStarter, "SS", 7.2)) === "coreCandidate");
const standardSchoolCrowded = makePositionFixture(7.4, [7.1, 6.9]);
standardSchoolCrowded.schoolStandard = "standard";
verify("10c. 普通學校的強 incumbent 與深度不保證玩家先發", EntryRoster.projectEntryRole(EntryRoster.deriveCompetitionContext(standardSchoolCrowded, "SS", 6.2)) === "benchCandidate");

const baseIds = candidateA.baseRoster.players.map(actor => actor.playerId).sort();
const benchInjected = EntryRoster.injectPlayerIntoSelectedRoster(candidateA.baseRoster, { id: "player", name: "Player", age: 16, primaryPosition: "SS", bats: "R", throws: "R", contact: 7, power: 6, speed: 7, defense: 7, arm: 7 }, { playerRole: "bench", playerPosition: "SS" });
verify("11. Bench injection 保留全部 incumbent 並只增加 player", baseIds.every(id => benchInjected.players.some(actor => actor.playerId === id)) && benchInjected.benchPlayers.some(actor => actor.id === "player"));
const starterInjected = EntryRoster.injectPlayerIntoSelectedRoster(candidateA.baseRoster, { id: "player", name: "Player", age: 16, primaryPosition: "SS", bats: "R", throws: "R", contact: 8, power: 7, speed: 8, defense: 8, arm: 8 }, { playerRole: "starter", playerPosition: "SS" });
const replacedId = starterInjected.playerInjection.replacedPlayerId;
verify("12. Starter injection 將 incumbent 移至 bench 而非刪除", starterInjected.battingOrder.some(slot => slot.playerId === "player" && slot.defensivePosition === "SS") && starterInjected.benchPlayers.some(actor => actor.playerId === replacedId) && starterInjected.players.some(actor => actor.playerId === replacedId));
const leftyInjected = EntryRoster.injectPlayerIntoSelectedRoster(candidateA.baseRoster, { id: "player", name: "Lefty", age: 16, primaryPosition: "SS", bats: "L", throws: "L", contact: 8, power: 7, speed: 8, defense: 8, arm: 8 }, { playerRole: "starter", playerPosition: "SS" });
verify("13. Shared legality 拒絕左投 C／2B／3B／SS starter assignment", ["C", "2B", "3B", "SS"].every(position => !TeamRoster.isHighSchoolPositionAssignmentLegal("L", position, 16)) && !leftyInjected.battingOrder.some(slot => slot.playerId === "player"));

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "team-roster-foundation.js", "team-strength-model.js", "high-school-entry-roster-context.js",
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "pitcher-catcher-tactical-integration.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "batted-ball-tag-up-execution.js", "match-situation-lifecycle.js",
  "plate-decision-foundation.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "match-experience-development.js", "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console: { log() {}, warn() {}, error: console.error },
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
  function __entryPlayer(seed=9001,position="游擊手",throws="R"){
    const target=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
    target.throws=throws; applyCanonicalPositionProfile(target,position,[]);
    target.schoolInvitationState=createDefaultSchoolInvitationState();
    return target;
  }
  function __selectEntry(seed=9001,matchSeed=111){
    player=__entryPlayer(seed);
    const state=generateSchoolInvitationSet(player,{generationSeed:"entry-"+seed});
    const selected=state.invitations[0]; finalizeSchoolInvitationSelection(player,selected.schoolId);
    materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});
    completeHighSchoolEntry({source:"test"});
    player.highSchoolStep=5; player.highSchoolRoleCode="rotation"; player.highSchoolTeamRole="rotation";
    pendingHighSchoolMatchSimulationSeed=matchSeed;
    return {selected,match:prepareHighSchoolYearOneMatch()};
  }
`);

const invitation = JSON.parse(evaluate(`(() => {player=__entryPlayer(9101);const state=generateSchoolInvitationSet(player,{generationSeed:"production-invitation"});return JSON.stringify({state,valid:validateSchoolInvitationSet(state),standards:SCHOOL_INVITATION_TIERS});})()`));
verify("14. Production 仍生成 exactly four legal invitations", invitation.state.invitations.length === 4 && invitation.valid.ok);
verify("15. Invitation 與 TeamRoster 共用 canonical standard vocabulary", JSON.stringify(invitation.standards) === JSON.stringify(TeamRoster.SCHOOL_STANDARDS) && invitation.state.invitations.every(item => item.schoolStandard === item.schoolTier));
verify("16. 每個 candidate 都保存合法 school-year base roster identity", invitation.state.invitations.every(item => item.schoolYearRosterIdentity?.identity && item.baseRoster && item.rosterGenerationSeed && item.yearIdentity));
verify("17. Invitation need／competition／role 均連到 actual base roster actors", invitation.state.invitations.every(item => item.positionNeed === item.positionCompetitionContext.positionNeed && item.positionCompetitionContext.starterId && item.baseRoster.players.some(actor => actor.playerId === item.positionCompetitionContext.starterId)));
verify("18. Four-school tradeoff diversity 在 roster integration 後保留", invitation.valid.diversity.tierDiversity && invitation.valid.diversity.roleDiversity && invitation.valid.diversity.competitionDiversity);

const reloadInvitation = evaluate(`(() => {player=__entryPlayer(9102);generateSchoolInvitationSet(player,{generationSeed:"reload-invitation"});const before=JSON.stringify(player.schoolInvitationState);player=normalizeSave(JSON.parse(JSON.stringify(player)));return before===JSON.stringify(player.schoolInvitationState);})()`);
verify("19. Invitation reload 不改 roster／need／competition／role／interest", reloadInvitation);

const selected = JSON.parse(evaluate(`(() => {player=__entryPlayer(9103);const state=generateSchoolInvitationSet(player,{generationSeed:"selection"});const invitation=state.invitations[1];finalizeSchoolInvitationSelection(player,invitation.schoolId);materializeSelectedHighSchoolRoster(player,{rosterRole:"bench"});const before=JSON.parse(JSON.stringify(player.schoolInvitationState));player=normalizeSave(JSON.parse(JSON.stringify(player)));const after=player.schoolInvitationState;return JSON.stringify({before,after,same:JSON.stringify(before)===JSON.stringify(after),invitation});})()`));
verify("20. Selection 鎖定同一 school-year roster identity", selected.after.selectedSchoolYearRosterIdentity.identity === selected.invitation.schoolYearRosterIdentity.identity);
verify("21. Selection base roster 與 invitation base roster actor identity 完全相同", JSON.stringify(selected.after.selectedBaseRoster.players.map(actor => actor.playerId)) === JSON.stringify(selected.invitation.baseRoster.players.map(actor => actor.playerId)));
verify("22. Selection reload 保留 roster、incumbents、competition 與 injection state", selected.same && selected.after.selectedSchoolRoster.playerInjection.playerId === "player");

const first = JSON.parse(evaluate(`(() => {const x=__selectEntry(9104,111);return JSON.stringify({selected:x.selected,match:x.match,schoolState:player.schoolInvitationState});})()`));
const second = JSON.parse(evaluate(`(() => {const x=__selectEntry(9104,999);return JSON.stringify({selected:x.selected,match:x.match,schoolState:player.schoolInvitationState});})()`));
verify("23. 不同 match seed 不改 selected school roster identity", first.schoolState.selectedSchoolYearRosterIdentity.identity === second.schoolState.selectedSchoolYearRosterIdentity.identity && first.match.rosters.home.teamRoster.generationSeed === second.match.rosters.home.teamRoster.generationSeed);
verify("24. Invitation incumbents 在 HS Year 1 Match 仍是同一 actor identities", first.selected.baseRoster.players.every(actor => first.match.rosters.home.teamRoster.players.some(matchActor => matchActor.playerId === actor.playerId)));
verify("25. Match 主隊直接 consume selected canonical roster", first.match.rosters.home.teamRoster.schoolId === first.selected.schoolId && first.match.rosters.home.teamRoster.generationSeed === first.selected.rosterGenerationSeed);
verify("26. Opportunity 使用 selected roster-derived need／competition", first.match.gameExposureState.opportunitySnapshot.positionNeed === first.schoolState.selectedPositionCompetitionContext.positionNeed && first.match.gameExposureState.opportunitySnapshot.competitionDepth === first.schoolState.selectedPositionCompetitionContext.competitionDensity);
verify("27. Match-specific identity 只影響對手，不重抽玩家學校 roster", first.match.rosters.away.teamRoster.generationSeed !== second.match.rosters.away.teamRoster.generationSeed && first.match.rosters.home.teamRoster.generationSeed === second.match.rosters.home.teamRoster.generationSeed);
const matchReload = evaluate(`(() => {player=normalizeSave(JSON.parse(JSON.stringify(player)));return player.schoolInvitationState.selectedSchoolYearRosterIdentity.rosterGenerationSeed===player.highSchoolMatch.rosters.home.teamRoster.generationSeed&&player.schoolInvitationState.selectedSchoolRoster.players.every(actor=>player.highSchoolMatch.rosters.home.teamRoster.players.some(matchActor=>matchActor.playerId===actor.playerId));})()`);
verify("27a. Match reload 保留 selected school-year identity 與 roster actors", matchReload);

const lefty = JSON.parse(evaluate(`(() => {player=__entryPlayer(9105,"捕手","L");const profile=getSchoolRecruitingPositionProfile(player);const state=generateSchoolInvitationSet(player,{generationSeed:"lefty"});const invitation=state.invitations[0];finalizeSchoolInvitationSelection(player,invitation.schoolId);const roster=materializeSelectedHighSchoolRoster(player,{rosterRole:"starter",playerPosition:"捕手"});return JSON.stringify({profile,positions:state.invitations.map(item=>item.positionCompetitionContext.position),injection:roster.playerInjection,lineup:roster.battingOrder});})()`));
verify("28. 左投 Invitation recruiting profile 不再評估 C／2B／3B／SS", !lefty.profile.candidatePositions.some(position => ["C", "2B", "3B", "SS"].includes(position)) && !lefty.positions.some(position => ["C", "2B", "3B", "SS"].includes(position)));
verify("29. School need 不能把左投硬塞回非法 starter 守位", lefty.injection.rosterRole === "bench" && !lefty.lineup.some(slot => slot.playerId === "player"));

console.log(`High School Entry Roster Integration v1: ${passed}/33 passed.`);
