"use strict";
const fs=require("node:fs"),path=require("node:path"),{context}=require("../../../tests/high-school-match-feedback-factuality-test.cjs");
const h=context(fs.readFileSync(path.join(__dirname,"../../../script.js"),"utf8")),rows=[];
for(const approach of ["zone","attack","advance"]){
 h.run(`__feedbackFixture("游擊手","starter",45000,16);__feedbackPlay(false,${JSON.stringify(approach)});`);
 const row={approach,...h.json('({moments:player.highSchoolMatch.completedMoments.map(m=>({inning:m.inning,decision:m.decision,quality:m.decisionQuality,execution:m.executionQuality})),coach:getHighSchoolPostMatchCoachFeedback(player.highSchoolMatch)})')};rows.push(row);
}
fs.writeFileSync(path.join(__dirname,"positive-probe.json"),JSON.stringify(rows,null,2)+"\n",{flag:"wx"});console.log(JSON.stringify(rows,null,2));
