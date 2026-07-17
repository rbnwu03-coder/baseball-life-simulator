const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
function makeGame() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return { innerHTML: "", value: "關係測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    window: { setTimeout(callback) { callback(); } }
  });
  for (const file of ["player.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  return context;
}

function runScenario(mode) {
  const game = makeGame();
  const azheHigh = ["high", "high_unqualified", "azhe_high"].includes(mode);
  const takaHigh = ["high", "high_unqualified", "taka_high"].includes(mode);
  const coachHigh = ["high", "high_unqualified", "coach_high"].includes(mode);
  const lowAll = ["distance", "ability_high_relation_low"].includes(mode);
  const hostileTaka = mode === "hostile";
  const disappointedCoach = mode === "coach_disappointed";
  vm.runInContext(`
    player = createInitialPlayer(${JSON.stringify(mode)});
    player.chapter = "發展期";
    Object.assign(player.baseballSkills, { batting: ${mode === "high_unqualified" ? 2 : 10}, catching: ${mode === "high_unqualified" ? 2 : 10}, baseballIQ: ${mode === "high_unqualified" ? 2 : 10}, control: 8 });
    player.body.injuryRisk = ${mode === "high_unqualified" ? 12 : 3};
    Object.assign(player.impression.azhe, { trusts: ${azheHigh ? 8 : 1}, feelsDistance: ${azheHigh ? 0 : 8} });
    Object.assign(player.impression.takahashi, { respect: ${takaHigh ? 8 : 1}, rivalry: ${takaHigh || hostileTaka ? 8 : 1}, underestimate: ${takaHigh ? 0 : 7} });
    Object.assign(player.impression.coach, { dependable: ${coachHigh ? 8 : 1}, leader: ${coachHigh ? 5 : 0}, immature: ${coachHigh ? 0 : 8} });
    Object.assign(player.relationships, { teammateBond: ${azheHigh ? 8 : 1}, rivalRespect: ${takaHigh ? 8 : 1}, rivalCompetition: ${takaHigh || hostileTaka ? 8 : 1}, coachTrust: ${coachHigh ? 9 : 1} });
    if (${azheHigh}) player.characterArc.azhe = "respected_equal";
    ["development_competition", "transition_amateur_job", "transition_relationship", "transition_checkpoint", "development_mentor", "development_opportunity", "development_market"].forEach(processRelationshipPayoffs);
    ensureRelationshipPayoffChoices("development_mentor", getEvent("development_mentor"));
  `, game);
  return vm.runInContext(`({
    payoffs: player.relationshipPayoffs,
    flags: player.flags,
    mentorChoices: getEvent("development_mentor").choices.map(choice => choice.payoffChoiceId || ""),
    statuses: [getRelationshipStatusText("azhe"), getRelationshipStatusText("takahashi"), getRelationshipStatusText("yamamoto")]
  })`, game);
}

const high = runScenario("high");
const distance = runScenario("distance");
const hostile = runScenario("hostile");
const unqualified = runScenario("high_unqualified");
const focusedScenarios = {
  "阿哲高信任": runScenario("azhe_high"), "阿哲疏遠": distance,
  "高橋高尊重": runScenario("taka_high"), "高橋敵對": hostile,
  "山本高信任": runScenario("coach_high"), "山本失望": runScenario("coach_disappointed"),
  "三人皆高": high, "三人皆低": distance,
  "關係高但能力不足": unqualified, "能力高但關係低": runScenario("ability_high_relation_low")
};

for (const npc of ["azhe", "takahashi", "yamamoto"]) {
  const types = new Set(high.payoffs.filter(item => item.npc === npc).map(item => item.type));
  if (types.size < 4) throw new Error(`${npc} 實際兌現類型少於四種`);
}
if (!high.mentorChoices.includes("azhe_equal_view")) throw new Error("阿哲高信任沒有解鎖新回應選項");
if (!high.mentorChoices.includes("takahashi_report") || !high.mentorChoices.includes("yamamoto_named_trial")) throw new Error("高橋或山本沒有改變可選行動");
if (!distance.payoffs.some(item => item.absence)) throw new Error("低關係沒有形成真實缺席");
if (distance.payoffs.some(item => !item.absence)) throw new Error("低關係仍取得正向資源兌現");
if (distance.mentorChoices.includes("azhe_equal_view")) throw new Error("疏遠阿哲仍提供高信任選項");
if (hostile.payoffs.some(item => item.id === "takahashi_market_backing" || item.id === "takahashi_hard_truth")) throw new Error("敵對高橋仍提供高尊重情報或市場背書");
if (unqualified.payoffs.some(item => ["yamamoto_second_chance", "yamamoto_recommendation_used", "takahashi_market_backing"].includes(item.id))) throw new Error("高關係在能力或健康不足時仍無條件取得最佳入口");
if (!unqualified.flags.includes("yamamoto_refused_unqualified_backing")) throw new Error("教練拒絕背書沒有留下實際結果");
if (!focusedScenarios["阿哲高信任"].payoffs.some(item => item.npc === "azhe" && !item.absence)) throw new Error("阿哲高信任未兌現");
if (!focusedScenarios["阿哲疏遠"].payoffs.some(item => item.npc === "azhe" && item.absence)) throw new Error("阿哲疏遠未形成缺席");
if (!focusedScenarios["高橋高尊重"].payoffs.some(item => item.npc === "takahashi" && item.type === "introduction")) throw new Error("高橋高尊重沒有測試介紹");
if (!focusedScenarios["山本高信任"].payoffs.some(item => item.npc === "yamamoto" && item.id === "yamamoto_role_naming")) throw new Error("山本沒有替角色命名");
if (focusedScenarios["能力高但關係低"].payoffs.some(item => !item.absence)) throw new Error("能力高但關係低仍取得舊關係資源");

console.table([high, distance, hostile, unqualified].map((item, index) => ({ scenario: ["三人高關係", "三人低／疏遠", "高競爭但敵對", "高關係但條件不足"][index], payoffs: item.payoffs.length, types: [...new Set(item.payoffs.map(payoff => payoff.type))].join("、") })));
console.log("Phase 14 relationship payoff test passed.");
