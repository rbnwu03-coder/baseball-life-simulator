const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const boundarySource = read("coach-evaluation-boundary.js");
const flowSource = read("coach-response-flow.js");
const storySource = read("story.js");
const scriptSource = read("script.js");
let validations = 0;
const verify = (message, condition) => { assert.ok(condition, message); validations += 1; };

verify("既有 Coach Response boundary 仍保留展示賽相容規格", boundarySource.includes("high_school_showcase") && flowSource.includes("high_school_showcase"));

const showcaseStart = storySource.indexOf("  high_school_showcase: {");
const showcaseEnd = storySource.indexOf("  high_school_scout_feedback: {", showcaseStart);
const showcase = storySource.slice(showcaseStart, showcaseEnd);
verify("高一交流賽不再由 coachTrust 單一門檻決定存取", showcaseStart >= 0 && !showcase.includes("CoachResponseFlow") && !showcase.includes("coachTrust >="));
verify("showcase 維持單一 Story wrapper，並委派給既有 High School Match owner", showcase.includes("getHighSchoolYearOneMatchPresentation") && showcase.includes("getHighSchoolYearOneMatchMomentChoices"));

const multiMomentStart = scriptSource.indexOf("const highSchoolYearOneMomentIds");
const multiMomentEnd = scriptSource.indexOf("function resolveHighSchoolAzheEcho", multiMomentStart);
const multiMomentMatch = scriptSource.slice(multiMomentStart, multiMomentEnd);
verify("同一場交流賽包含對手、局數、出局、比分、跑者、角色、守位與任務", ["opponent", "inning", "outs", "scores", "runners", "role", "position", "assignment"].every(token => multiMomentMatch.includes(token)));
verify("展示賽保留三個真正打席決策", ["attack", "zone", "advance"].every(code => multiMomentMatch.includes(`matchDecision: "${code}"`)));
verify("展示賽新增守備 domain 與三段穩定 identity", ["secure", "challenge", "contain"].every(code => multiMomentMatch.includes(`matchDecision: "${code}"`)) && [1, 2, 3].every(index => multiMomentMatch.includes(`hs_y1_match_moment_${index}`)));

const roleStart = scriptSource.indexOf("function resolveHighSchoolProvisionalRole()");
const roleEnd = scriptSource.indexOf("function prepareHighSchoolYearOneMatch()", roleStart);
const roleResolver = scriptSource.slice(roleStart, roleEnd);
verify("暫定角色採守位、信任、工具、健康與過往證明的複合判定", ["positionRating", "coachReady", "roleToolReady", "healthy", "priorProof"].every(token => roleResolver.includes(token)));
verify("三種角色均保留正式比賽任務", ["starter", "rotation", "bench"].every(code => roleResolver.includes(code)) && !/code\s*===\s*["']bench["'][\s\S]*return false/.test(roleResolver));

const matchStart = scriptSource.indexOf("function prepareHighSchoolYearOneMatch()");
const matchEnd = scriptSource.indexOf("function resolveHighSchoolYearOneMatch", matchStart);
const matchPreparation = scriptSource.slice(matchStart, matchEnd);
verify("三種角色共用同一比賽 id", matchPreparation.includes('id: "hs-y1-autumn-exhibition"'));
verify("投打慣用側進入任務脈絡", matchPreparation.includes("player.bats") && matchPreparation.includes("player.throws"));

console.log(`Coach Response Expansion validations：${validations}`);
console.log("Golden High School Showcase（三種角色同場三段任務）：通過");
console.log("Phase 8 Coach Response Expansion test passed.");
