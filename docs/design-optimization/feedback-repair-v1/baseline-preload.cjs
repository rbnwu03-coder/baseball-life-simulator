"use strict";
// Isolated diagnostic only: exact captured source bytes, unchanged legacy suite and assertions.
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../../.."),read=fs.readFileSync;
const sources=new Map([[path.join(root,"script.js"),path.join(__dirname,"script-before.js.txt")],[path.join(root,"story.js"),path.join(__dirname,"story-before.js.txt")]]);
fs.readFileSync=function(file,...args){const original=typeof file==="string"?sources.get(path.resolve(file)):null;return read.call(this,original||file,...args);};
