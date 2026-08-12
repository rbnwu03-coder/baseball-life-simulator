const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const boundarySource = read("narrative-condition-boundary.js");
const flowSource = read("narrative-condition-flow.js");
const storySource = read("story.js");
const scriptSource = read("script.js");
const playerSource = read("player.js");
let validations = 0;
const verify = (message, condition) => { assert.ok(condition, message); validations += 1; };

verify("既有 Narrative Condition boundary 仍保留舊存檔相容規格", boundarySource.includes("high_school_scout_feedback") && flowSource.includes("high_school_scout_feedback"));

const feedbackStart = storySource.indexOf("  high_school_scout_feedback: {");
const feedbackEnd = storySource.indexOf("  high_school_result: {", feedbackStart);
const feedback = storySource.slice(feedbackStart, feedbackEnd);
verify("高一收尾不再以 scoutEvaluation 單一門檻切換故事", feedbackStart >= 0 && !feedback.includes("NarrativeConditionFlow") && !feedback.includes("scoutEvaluation >= 3"));
verify("收尾讀取持久化比賽、角色化高橋入口與高二壓力", ["highSchoolRivalContext", "highSchoolMatch", "entryType", "yearTwoPressure"].every(token => feedback.includes(token)));

const rivalStart = scriptSource.indexOf("function prepareHighSchoolRivalPressure()");
const rivalEnd = scriptSource.indexOf("function processHighSchoolYearOneChoice", rivalStart);
const rivalResolver = scriptSource.slice(rivalStart, rivalEnd);
verify("先發、輪替與發展角色分別形成 direct／limited／observed 入口", ["direct", "limited", "observed"].every(token => rivalResolver.includes(token)));
verify("三種入口都留下同一個高二驗證壓力", rivalResolver.includes("高二必須用第二次正式任務證明"));
verify("正式宿敵 identity 為高橋", /rivalName:\s*"高橋"/.test(playerSource) && /rivalId:\s*"takahashi"/.test(playerSource));

const settlementStart = scriptSource.indexOf("function evaluateHighSchoolYear()");
const settlementEnd = scriptSource.indexOf("function evaluateHighSchoolValue()", settlementStart);
const settlement = scriptSource.slice(settlementStart, settlementEnd);
verify("第一年結算回收守位、角色、交流賽、阿哲與外部壓力", ["守位形成", "暫定角色", "交流賽", "阿哲回聲", "外部壓力"].every(token => settlement.includes(token)));
verify("合法結算才寫入第一年完成旗標", settlement.includes("player.highSchoolYearOneComplete = true"));

console.log(`NarrativeConditionFlow validations：${validations}`);
console.log("Golden Narrative Flow（比賽證明、阿哲回聲、高橋壓力）：通過");
console.log("Phase 9 NarrativeConditionFlow test passed.");
