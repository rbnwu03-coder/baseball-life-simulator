"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),crypto=require("node:crypto");
const {execFileSync,spawnSync}=require("node:child_process");
const root=path.resolve(__dirname,"../../.."),commit="009037725fbbdc0ce8603105fc6682bca6c4da4f";
const git=(...args)=>execFileSync("git",["-c",`safe.directory=${root.replaceAll("\\","/")}`,...args],{cwd:root,maxBuffer:16000000});
const index=git("show",`${commit}:index.html`).toString("utf8");
const files=["index.html",...[...index.matchAll(/<script src="([^"]+)"/g)].map(row=>row[1]),
  "tests/high-school-career-test-context.js","tests/match-full-game-record-test.js"];
const baseline=fs.mkdtempSync(path.join(os.tmpdir(),"catcher-v3-record-baseline-"));
const sources=files.map(file=>{const bytes=git("show",`${commit}:${file}`),target=path.join(baseline,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  return {file,sha256:crypto.createHash("sha256").update(bytes).digest("hex")};});
const result=spawnSync(process.execPath,["tests/match-full-game-record-test.js"],{cwd:baseline,encoding:"utf8",timeout:60000});
const log=(result.stdout||"")+(result.stderr||"");fs.writeFileSync(path.join(__dirname,"match-full-game-record-baseline.log"),log);
fs.writeFileSync(path.join(__dirname,"record-baseline-comparison.json"),JSON.stringify({commit,baseline,sources,exitCode:result.status,
  sameBlocker:log.includes("BUNT_FALLBACK_SETTLEMENT_OWNER_MISSING"),scope:"Existing non-catcher full-career bunt boundary; no expansion"},null,2)+"\n");
console.log(JSON.stringify({commit,exitCode:result.status,sameBlocker:log.includes("BUNT_FALLBACK_SETTLEMENT_OWNER_MISSING")}));
