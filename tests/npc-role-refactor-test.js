const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({
  console,
  document: { getElementById() { return { innerHTML: "", value: "NPC 測試", style: {} }; }, querySelectorAll() { return []; }, querySelector() { return null; } },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout(callback) { callback(); } }
});
for (const file of ["player.js", "story.js", "save.js", "script.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });

const result = vm.runInContext(`
  player = createInitialPlayer("NPC 測試");
  player.impression.coach.dependable = 6;
  player.relationships.coachTrust = 7;
  player.baseballSkills.catching = 8;
  ({
    audit: auditNpcRoleConflicts(),
    names: {
      youth: getNpcDisplayName("yamamoto", "少棒第一季"),
      junior: getNpcDisplayName("yamamoto", "青少棒"),
      highSchool: getNpcDisplayName("yamamoto", "青棒"),
      adult: getNpcDisplayName("yamamoto", "發展期")
    },
    juniorText: juniorBaseballEvents.junior_coach_disagreement.text(),
    recommendationText: juniorSeasonEvents.yamamoto_recommendation.text(),
    adultScene: getJointRelationshipScene()
  })
`, context);

if (result.audit.roleMapIssues.length) throw new Error(`NPC Role Map 欄位不完整：${JSON.stringify(result.audit.roleMapIssues)}`);
if (result.audit.conflicts.length) throw new Error(`仍有職能衝突：${JSON.stringify(result.audit.conflicts)}`);
if (Object.keys(result.audit.matrix).length !== 3) throw new Error("核心 NPC 數量不正確");
if (!Object.values(result.audit.matrix).every(map => Object.keys(map).length === 5)) throw new Error("NPC 未涵蓋五個人生階段");
if (result.names.youth !== "山本教練" || result.names.junior !== "少棒恩師山本" || result.names.highSchool !== "山本導師" || result.names.adult !== "山本導師") throw new Error(`山本稱謂錯誤：${JSON.stringify(result.names)}`);
if (/山本教練.*(選高橋|繼續先發)/.test(result.juniorText)) throw new Error("青少棒仍由山本決定名單");
if (!result.juniorText.includes("國中隊教練") || !result.juniorText.includes("不能替你改名單")) throw new Error("青少棒現任教練與恩師權限未說清楚");
if (!result.recommendationText.includes("現任球隊決定")) throw new Error("山本推薦仍像直接取得高中權力");
if (!result.adultScene.includes("入口") || !result.adultScene.includes("不是名單保證")) throw new Error("成年山本介紹缺少權限限制");

console.table(result.audit.matrix);
console.log("Phase 14.5 NPC role refactor test passed.");
