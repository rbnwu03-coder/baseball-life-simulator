"use strict";
// Independent headless browser; temporary profile is outside the repository and never cleaned recursively.
const fs = require("node:fs"), cp = require("node:child_process"), path = require("node:path"), os = require("node:os"), url = require("node:url"), assert = require("node:assert/strict"), crypto = require("node:crypto");
const F = require("../receiver-execution-v2-2-foundation.js"), T = require("./receiver-execution-v2-2-contract-test.cjs");
function run() {
  const cases = ["plain", "unicode", "nonbmp", "combining", "long264", "max4096", "precontact", "late", "hold", "negativeRunner"].map(name => {
    const i = name === "hold" ? T.noDelivery() : T.fixture();
    if (name === "unicode") i.identity.physical.physicalIdentity = "\u4e0a|\u68d2\u7403";
    if (name === "nonbmp") i.identity.physical.physicalIdentity = "\ud83c\udfdf";
    if (name === "combining") i.identity.physical.physicalIdentity = "e\u0301";
    if (name === "long264") i.actual.canonicalSourceId = "x".repeat(264);
    if (name === "max4096") i.identity.physical.contactId = "\u4e0a".repeat(4096);
    if (name === "precontact") { i.timing.times.positioningStart.decimal = "99.75"; i.positioning.preContactAuthorized = true; }
    if (name === "late") { i.positioning.startContext = "covering"; i.positioning.movementMdu = 5; }
    if (name === "negativeRunner") i.timing.times.runnerArrival.decimal = "99";
    return { name, input: T.sync(i) };
  });
  const test = api => cases.map(c => ({ name: c.name, vector: api.sampleVector(c.input.identity.physical, "primaryThrow"), output: api.execute(api.seal(c.input)), encoding: api.canonicalEncode(c.input.identity) }));
  const expected = test(F), dir = fs.mkdtempSync(path.join(os.tmpdir(), "receiver-v22-browser-"));
  const html = '<meta charset="utf-8"><pre id="result"></pre><script>Math.random=()=>{throw Error("random forbidden")};</script><script>' +
    fs.readFileSync(require.resolve("../receiver-execution-v2-foundation.js"), "utf8") + '</script><script>' +
    fs.readFileSync(require.resolve("../receiver-execution-v2-2-foundation.js"), "utf8") + '</script><script>const cases=' + JSON.stringify(cases) +
    ';const api=ReceiverExecutionV22Foundation;document.getElementById("result").textContent=JSON.stringify({userAgent:navigator.userAgent,results:cases.map(c=>({name:c.name,vector:api.sampleVector(c.input.identity.physical,"primaryThrow"),output:api.execute(api.seal(c.input)),encoding:api.canonicalEncode(c.input.identity)}))});</script>';
  fs.writeFileSync(path.join(dir, "probe.html"), html);
  const browser = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  if (!fs.existsSync(browser)) return { status: "NOT_RUN", reason: "Chrome executable unavailable" };
  const r = cp.spawnSync(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "profile"), "--dump-dom", url.pathToFileURL(path.join(dir, "probe.html")).href],
    { encoding: "utf8", windowsHide: true, timeout: 30000, maxBuffer: 5000000 });
  const match = r.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/);
  if (!match) return { status: "NOT_RUN", reason: r.error?.message || "Browser process failed", exit: r.status, stderr: r.stderr?.slice(-1200) };
  const data = JSON.parse(match[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
  assert.deepEqual(data.results, expected);
  return { status: "PASS", runtime: "independent Chrome headless process", userAgent: data.userAgent, count: data.results.length, MathRandom: "trap",
    comparison: "canonical UTF8/hash/u32BE/unit and complete stage outputs equal Node", temporaryProbe: dir,
    sourceHashes: Object.fromEntries(["receiver-execution-v2-foundation.js", "receiver-execution-v2-2-foundation.js"].map(p => [p, crypto.createHash("sha256").update(fs.readFileSync(require.resolve("../" + p))).digest("hex")])), results: data.results };
}
module.exports = { run };
if (require.main === module) {
  if (process.argv.slice(2).some(a => !["--capture", "--capture-final"].includes(a)) || process.argv.slice(2).length > 1) throw Error("Unsupported flag");
  const capture = process.argv.includes("--capture") || process.argv.includes("--capture-final");
  const out = "docs/receiver-execution-v2-sprint-10a3a-browser" + (process.argv.includes("--capture-final") ? "-final" : "") + "-evidence.json";
  if (capture && fs.existsSync(out)) throw Error("Capture already exists");
  const r = run();
  if (r.status === "PASS" && capture) fs.writeFileSync(out, JSON.stringify(r, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ ...r, results: undefined }, null, 2)); if (r.status !== "PASS") process.exitCode = 1;
}
