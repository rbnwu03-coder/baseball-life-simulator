const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

const page = read("gameplay-prototype.html");
const productionPage = read("index.html");
const coreFiles = ["baseball-gameplay-prototype-utils.js", "baseball-offense-prototype.js", "baseball-defense-prototype.js"];
const coreSource = coreFiles.map(read).join("\n");

verify("獨立 gameplay-prototype.html 已建立", fs.existsSync(path.join(root, "gameplay-prototype.html")));
verify("正式 index.html 不載入任何 Prototype JS", !/baseball-(?:offense|defense|gameplay)-prototype/i.test(productionPage));
verify("Prototype 頁面不載入 player.js", !/src=["']player\.js["']/i.test(page));
verify("Prototype 頁面不載入 save.js", !/src=["']save\.js["']/i.test(page));
verify("Prototype 頁面不載入 story.js", !/src=["']story\.js["']/i.test(page));
verify("Prototype 頁面不載入 script.js", !/src=["']script\.js["']/i.test(page));
verify("Prototype 頁面不載入 application-controller 或 Career modules", !/application-controller|career-(?:spine|transition|development|age22|save|rejoin)/i.test(page));
verify("Prototype core 不存取 localStorage／sessionStorage／indexedDB", !/localStorage|sessionStorage|indexedDB/.test(coreSource));
verify("Prototype core 不存取 DOM", !/document\.|querySelector|getElementById|createElement|addEventListener/.test(coreSource));
verify("Prototype core 不存取正式全域 Player", !/window\.player|globalThis\.player|\bplayer\s*=/.test(coreSource));
verify("Prototype core 不依賴 Story、Save、NPC、Coach、Relationship 或 Time", !/Story|saveGame|loadGame|NPC|Coach|Relationship|TimeBoundary|ApplicationController/.test(coreSource));
verify("Prototype core 不自行呼叫非決定性亂數或時間", !/Math\.random|Date\.now|performance\.now/.test(coreSource));
verify("Prototype core 可由 Node 獨立載入", coreFiles.every(file => require(path.join(root, file))));
verify("SAVE_VERSION 維持 14", /const\s+SAVE_VERSION\s*=\s*14\s*;/.test(read("player.js")));
verify("SAVE_KEY 維持 baseballLifeRpgSave", /const\s+SAVE_KEY\s*=\s*["']baseballLifeRpgSave["']\s*;/.test(read("save.js")));
verify("正式 Player Schema 未加入 transient gameplay state", !/decisionQuality\s*:|executionQuality\s*:|currentAtBatApproach\s*:|fieldingApproach\s*:|throwDecision\s*:/.test(read("player.js")));
verify("Sandbox RNG 僅在獨立 UI 記憶體中運作", /function\s+nextRandom/.test(read("baseball-gameplay-prototype-sandbox.js")) && !/localStorage|sessionStorage|indexedDB/.test(read("baseball-gameplay-prototype-sandbox.js")));
verify("Stage A 重跑前會清除舊的 Stage B 結果", /function\s+runFielding\s*\(\)\s*\{\s*clearThrowOutcome\(\)/.test(read("baseball-gameplay-prototype-sandbox.js")));

console.log(`\nGameplay Sprint 5.1 Prototype Isolation：${passed}/${passed} 通過`);
