"use strict";
// Isolated classification replay only; no assertion or engine resolver is replaced.
const fs=require("node:fs"),path=require("node:path"),read=fs.readFileSync,root=path.resolve(__dirname,"../../..");
const sources=new Map(["script.js","story.js"].map(p=>[path.join(root,p),path.join(__dirname,p+".before.txt")]));
fs.readFileSync=function(file,...args){return read.call(this,typeof file==="string"?sources.get(path.resolve(file))||file:file,...args);};
