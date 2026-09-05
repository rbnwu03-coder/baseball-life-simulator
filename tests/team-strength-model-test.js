const assert = require("assert");
const Roster = require("../team-roster-foundation.js");
const Strength = require("../team-strength-model.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

function make(standard, seed, extra = {}) {
  const roster = Roster.generateTeamRoster({ teamId: `${standard}-${seed}-${extra.composition || "natural"}`, schoolStandard: standard, yearIdentity: 2026, seed, ...extra });
  return { roster, profile: Strength.deriveTeamStrengthProfile(roster) };
}

const power = make("powerhouse", 4101);
const average = make("standard", 4101);
const weak = make("development", 4101);
verify("1. Team Strength 是 multidimensional profile", ["lineupQuality", "powerThreat", "contactQuality", "speedQuality", "defenseQuality", "armQuality", "startingPitchingQuality", "pitchingDepth", "rosterDepth"].every(key => key in power.profile));
verify("2. Lineup 保留 contact/power/speed distribution", [power.profile.contactQuality, power.profile.powerThreat, power.profile.speedQuality].every(item => ["mean", "topThird", "bottomThird", "peak", "spread"].every(key => key in item)));
verify("3. 打線區分 top/middle/bottom order", ["topOfOrderQuality", "middleOrderThreat", "bottomOrderQuality"].every(key => key in power.profile.lineupQuality));
verify("4. 投手品質分開 starter 與 pitching depth", Number.isFinite(power.profile.startingPitchingQuality) && Number.isFinite(power.profile.pitchingDepth));
verify("5. 跑壘由 speed distribution 形成", power.profile.baserunningQuality === power.profile.speedQuality.mean && Number.isInteger(power.profile.aggressiveRunnerCount));
verify("6. overallSummary 只是衍生欄位，roster 沒有 overall truth", Number.isFinite(power.profile.overallSummary) && !("overallSummary" in power.roster));
verify("7. 相同 rolls 下 powerhouse 預期 profile 高於 average", power.profile.overallSummary > average.profile.overallSummary);
verify("8. 相同 rolls 下 average 預期 profile 高於 weak", average.profile.overallSummary > weak.profile.overallSummary);

const topHeavy = make("competitive", 4201, { composition: "topHeavy" });
const deep = make("competitive", 4201, { composition: "deep" });
verify("9. Top-heavy roster 有更大的明星／深度落差", topHeavy.profile.rosterDepth.topHeavyGap > deep.profile.rosterDepth.topHeavyGap);
verify("10. Deep roster bench quality 高於 top-heavy", deep.profile.rosterDepth.benchQuality > topHeavy.profile.rosterDepth.benchQuality);
verify("11. Deep roster pitching depth 高於 top-heavy", deep.profile.pitchingDepth > topHeavy.profile.pitchingDepth);

const weakCatcher = make("powerhouse", 4301, { positionWeaknesses: { C: 3 } });
const normalCatcher = make("powerhouse", 4301);
verify("12. Position weakness 會透過 assigned defender 降低防守 profile", weakCatcher.profile.defenseQuality < normalCatcher.profile.defenseQuality);

const comparison = Strength.explainComparison(power.profile, weak.profile);
verify("13. Comparison 可解釋六個來源而非只回 overall", comparison.map(item => item.area).join("|") === "Lineup|Starting Pitching|Pitching Depth|Defense|Speed|Roster Depth");
verify("14. Comparison 保留各面向雙方數值與 advantage", comparison.every(item => Number.isFinite(item.first) && Number.isFinite(item.second) && [-1, 0, 1].includes(item.advantage)));

const yearly = Array.from({ length: 12 }, (_, year) => make("powerhouse", 4401, { yearIdentity: 2026 + year }).profile.overallSummary);
verify("15. 同 school prior 不同年份具有 strength variation", new Set(yearly).size > 3);

const averages = standard => {
  const profiles = Array.from({ length: 30 }, (_, index) => make(standard, 5000 + index).profile);
  return profiles.reduce((sum, profile) => sum + profile.overallSummary, 0) / profiles.length;
};
verify("16. 多年份分布下強校 expected strength 高於普通校", averages("powerhouse") > averages("standard") + 8);
verify("17. School standard 只存在 roster generator prior，profile 不讀 schoolStandard", !Strength.deriveTeamStrengthProfile.toString().includes("schoolStandard"));

console.log(`Team Strength Model tests: ${passed}/17 passed.`);
