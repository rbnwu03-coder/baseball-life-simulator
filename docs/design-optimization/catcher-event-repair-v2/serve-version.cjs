"use strict";
const http = require("node:http"), path = require("node:path"), crypto = require("node:crypto");
const {execFileSync} = require("node:child_process");
const root = path.resolve(__dirname,"../../..");
const commit = process.argv[2], port = Number(process.argv[3] || 8766);
if (!/^[a-f0-9]{40}$/.test(commit || "")) throw new Error("Pass the full committed test-version SHA");
const git = (...args) => execFileSync("git",["-c",`safe.directory=${root.replaceAll("\\","/")}`,...args],{cwd:root,maxBuffer:16000000});
if (git("rev-parse","HEAD").toString().trim() !== commit) throw new Error("Test version must equal current repair HEAD");
const cache = new Map();
function asset(file) {
  if (!cache.has(file)) cache.set(file,git("show",`${commit}:${file}`));
  return cache.get(file);
}
const version = {commit, root, pageAcceptance:"未完成：仍需兩場至年末健康切片", continuation:"NPC groundBunt/hard/secondBaseSide owner implemented; other bunt shapes remain guarded",
  scriptSha256:crypto.createHash("sha256").update(asset("script.js")).digest("hex")};
const mime = {".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml", ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg"};
const server = http.createServer((req,res) => {
  res.setHeader("X-Test-Commit",commit); res.setHeader("Cache-Control","no-store");
  if (!["GET","HEAD"].includes(req.method)) {res.writeHead(405); return res.end();}
  try {
    const route = decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    if (route === "/__version") {res.setHeader("Content-Type",mime[".json"]); return res.end(JSON.stringify(version));}
    const file = route === "/" ? "index.html" : route.slice(1);
    if (!file || file.split(/[\\/]/).some(part=>part===".." || part===".git") || file.includes(":")) throw new Error("Invalid asset path");
    const body = asset(file);
    res.setHeader("Content-Type",mime[path.extname(file)] || "application/octet-stream");
    res.setHeader("Content-Length",body.length);
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {res.writeHead(404);res.end("Not found in test commit");}
});
server.listen(port,"127.0.0.1",()=>console.log(JSON.stringify({url:`http://127.0.0.1:${port}/index.html`,...version})));
