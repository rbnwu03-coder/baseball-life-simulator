"use strict";
const fs=require("node:fs"),path=require("node:path");
const r=JSON.parse(fs.readFileSync(path.join(__dirname,"gameplay-results.json"),"utf8")),rows=r.experiments.pairedMatches||[];
const sum=(xs,fn)=>xs.reduce((n,x)=>n+(fn(x)||0),0);
const summary={checks:r.checks.map(x=>({name:x.name,status:x.status,error:x.error?.split("\n")[0]})),arms:{},healthIdenticalPairs:0,naturalExamples:{goodLoss:[],poorWin:[]}};
for(const arm of [...new Set(rows.map(x=>x.arm))]){
 const xs=rows.filter(x=>x.arm===arm),PA=sum(xs,x=>x.line?.batting.PA),AB=sum(xs,x=>x.line?.batting.AB),H=sum(xs,x=>x.line?.batting.H);
 const games=xs.length,wins=xs.filter(x=>x.teamResult?.includes("勝利")).length;
 // Wilson interval is descriptive for these seeded fixtures, not representative population uncertainty.
 const z=1.96,p=wins/games,den=1+z*z/games,c=(p+z*z/(2*games))/den,m=z*Math.sqrt(p*(1-p)/games+z*z/(4*games*games))/den;
 summary.arms[arm]={games,wins,winRate:p,descriptiveWilson95:[c-m,c+m],PA,AB,H,AVG:AB?H/AB:null,SO:sum(xs,x=>x.line?.batting.SO),BB:sum(xs,x=>x.line?.batting.BB),meanDefensiveInnings:sum(xs,x=>x.exposure.defensiveInnings)/games,noAppearances:xs.filter(x=>x.exposure.appearanceType==="noAppearance").length,meanEvaluation:sum(xs,x=>x.evaluation.accumulatedScore)/games,quality:sum(xs,x=>x.evaluation.matchEvidence.quality)/games,choices:sum(xs,x=>x.choices),decisions:xs.reduce((a,x)=>{for(const[k,v]of Object.entries(x.seen))a[k]=(a[k]||0)+v;return a;},{})};
}
for(const a of rows.filter(x=>x.arm==="healthy"))if(a.recordDigest===rows.find(b=>b.seed===a.seed&&b.arm==="loaded").recordDigest)summary.healthIdenticalPairs++;
for(const x of rows){const q=x.evaluation.matchEvidence.quality,entry={seed:x.seed,arm:x.arm,teamResult:x.teamResult,quality:q,score:x.evaluation.accumulatedScore,coach:x.coachReaction};if(q>0&&x.teamResult.includes("落敗"))summary.naturalExamples.goodLoss.push(entry);if(q<0&&x.teamResult.includes("勝利"))summary.naturalExamples.poorWin.push(entry);}
summary.naturalExamples.goodLoss=summary.naturalExamples.goodLoss.slice(0,3);summary.naturalExamples.poorWin=summary.naturalExamples.poorWin.slice(0,3);
fs.writeFileSync(path.join(__dirname,"gameplay-summary.json"),JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify(summary,null,2));
