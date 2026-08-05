const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const runtimeFiles = ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"];
const source = runtimeFiles.map(file => fs.readFileSync(path.join(root, file), "utf8"));
const nodes = new Map();
const context = vm.createContext({
  console,
  document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, { innerHTML: "", value: "", style: {} }); return nodes.get(id); } },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout(callback) { callback(); } }
});
source.forEach((code, index) => vm.runInContext(code, context, { filename: runtimeFiles[index] }));

const groups = vm.runInContext(`({
  童年: chapterOneEvents,
  少棒入門: chapterTwoEvents,
  少棒第一季: youthSeasonEvents,
  位置競爭: positionCompetitionEvents,
  青少棒開場: juniorBaseballEvents,
  青少棒分化: juniorSeasonEvents,
  青棒: highSchoolEvents,
  青棒第二年: highSchoolYearTwoEvents,
  青棒關鍵年: criticalYearEvents,
  生涯轉換: careerTransitionEvents,
  發展期: developmentEvents,
  呼吸事件: pacingEvents
})`, context);

const producedFlags = new Set();
const rows = [];
const highCostLowReturn = [];
for (const [name, events] of Object.entries(groups)) {
  const values = Object.values(events);
  let choices = 0;
  let effectChoices = 0;
  let costChoices = 0;
  for (const [eventId, event] of Object.entries(events)) {
    for (const choice of event.choices || []) {
      choices += 1;
      (choice.flags || []).forEach(flag => producedFlags.add(flag));
      const effectObjects = [choice.effects, choice.skillEffects, choice.relationshipEffects, choice.bodyEffects, choice.academicEffects, choice.highSchoolEffects, choice.careerEffects, choice.financeEffects, choice.matchEffects, choice.positionEffects, choice.positionSkillEffects];
      if (effectObjects.some(object => object && Object.keys(object).length)) effectChoices += 1;
      const serialized = JSON.stringify(effectObjects);
      if (/:-[1-9]/.test(serialized) || /"fatigue":[1-9]/.test(serialized) || /"pressure":[1-9]/.test(serialized) || /"injuryRisk":[1-9]/.test(serialized)) costChoices += 1;
      const cost = [choice.effects?.pressure, choice.bodyEffects?.fatigue, choice.bodyEffects?.injuryRisk, choice.bodyEffects?.pain, choice.academicEffects?.burnout]
        .reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
      const directBenefit = [choice.skillEffects, choice.personalityEffects, choice.impressionEffects, choice.relationshipEffects, choice.positionEffects, choice.positionSkillEffects, choice.careerEffects, choice.academicEffects, choice.highSchoolEffects, choice.financeEffects]
        .some(object => object && Object.keys(object).length);
      const riskReduction = [choice.effects?.pressure, choice.bodyEffects?.fatigue, choice.bodyEffects?.injuryRisk, choice.bodyEffects?.pain, choice.academicEffects?.burnout]
        .some(value => Number(value) < 0);
      const routeBenefit = (choice.flags || []).some(flag => source.join("\n").includes(`hasFlag("${flag}")`) || source.join("\n").includes(`${flag}: { id:`));
      if (cost >= 2 && !directBenefit && !riskReduction && !routeBenefit) highCostLowReturn.push({ chapter: name, eventId, choice: choice.text, cost, benefit: "僅留下尚未回收的 flag／文字" });
    }
  }
  rows.push({ name, events: values.length, choices, effectRate: choices ? Math.round(effectChoices / choices * 100) : 0, costRate: choices ? Math.round(costChoices / choices * 100) : 0 });
}

const usedFlags = new Set([...source.join("\n").matchAll(/hasFlag\(["']([^"']+)["']\)/g)].map(match => match[1]));
const unreturned = [...producedFlags].filter(flag => !usedFlags.has(flag));
console.table(rows);
console.log(`產生 flags：${producedFlags.size}`);
console.log(`被 hasFlag 回收：${[...producedFlags].filter(flag => usedFlags.has(flag)).length}`);
console.log(`尚未直接回收：${unreturned.length}`);
console.log(unreturned.join("、"));
console.log(`高成本低回報選項：${highCostLowReturn.length}`);
if (highCostLowReturn.length) console.table(highCostLowReturn);
