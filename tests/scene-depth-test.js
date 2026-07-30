const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({
  console,
  document: {
    getElementById() { return { innerHTML: "", value: "場景測試球員", style: {} }; },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout(callback) { callback(); } }
});

for (const file of ["player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "coach-evaluation-boundary.js", "decision-flow.js", "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "story.js", "save.js", "script.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

vm.runInContext(`
  player = createInitialPlayer("場景測試球員");
  Object.keys(signatureSceneLibrary).forEach(getSignatureSceneText);
  recordLifeEvent({ id: "first_appearance", title: "第一次正式上場", importance: 4, emotion: "joy" });
  recordLifeEvent({ id: "first_lost_position", title: "第一次失去位置", importance: 5, emotion: "loss" });
  recordLifeEvent({ id: "azhe_goodbye", title: "阿哲離開", importance: 5, emotion: "loss" });
`, context);

const result = vm.runInContext(`({
  scenes: player.signatureScenes,
  objects: player.symbolObjects,
  quality: auditSceneQuality(),
  density: auditEmotionalDensity(),
  revisit: [getRevisitSceneText("transition_checkpoint"), getRevisitSceneText("development_opportunity"), getRevisitSceneText("transition_relationship")]
})`, context);

if (result.scenes.length < 15) throw new Error("代表場景數量不足");
if (result.objects.length < 8) throw new Error("象徵物數量不足");
if (Object.values(result.quality.missing).some(items => items.length)) throw new Error(`場景品質欄位不完整：${JSON.stringify(result.quality.missing)}`);
if (!result.density.every(item => item.meetsTarget)) throw new Error("仍有章節未達情緒密度標準");
if (result.revisit.some(text => !text)) throw new Error("人生事件沒有被重新演出");

const relationshipMoments = { azhe: new Set(), takahashi: new Set(), yamamoto: new Set() };
for (const scene of result.scenes) {
  for (const [npc, beat] of Object.entries(scene.relationshipMoments || {})) relationshipMoments[npc]?.add(beat);
}
for (const [npc, beats] of Object.entries(relationshipMoments)) {
  for (const required of ["joy", "conflict", "farewell", "reunion"]) {
    if (!beats.has(required)) throw new Error(`${npc} 缺少 ${required} 關係場景`);
  }
}

console.table(result.density);
console.log(`代表場景 ${result.scenes.length}／特殊物件 ${result.objects.length}／沉默演出 ${result.scenes.filter(scene => scene.silent).length}`);
console.log("Phase 12 scene depth test passed.");
