const assert=require("assert");
const Evidence=require("../high-school-career-evaluation.js");
function fixture() {return {name:"Evidence",primaryPosition:"C",highSchoolRoleCode:"rotation",highSchoolYearOneStartingRole:"bench",baseballSkills:{batting:10,catching:12,blocking:12,gameCalling:12,throwing:12,baseballIQ:10},body:{injuryRisk:0},academics:6,
  highSchoolYearOneMatchHistory:[{matchId:"y1",actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3,failure:0,mixed:0},evaluationConsequence:{previousRole:"bench",currentRole:"rotation"}}],
  highSchoolYearTwoMatchHistory:[{matchId:"y2",actualExposure:{plateAppearances:4,defensiveInnings:7},playerContribution:{strong:3,failure:0,mixed:0},evaluationConsequence:{previousRole:"rotation",currentRole:"starter"}}],
  highSchoolYearThreeMatchHistory:[],highSchoolYearTransitionState:{history:[{nextHighSchoolYear:2,priorRole:"rotation",currentRole:"rotation"},{nextHighSchoolYear:3,priorRole:"starter",currentRole:"rotation"}]}};}
const p=fixture(),before=JSON.stringify(p),e=Evidence.derive(p);
assert.strictEqual(JSON.stringify(p),before,"read-only derivation");
assert.strictEqual(e.formalMatches.sampleCount,2);
assert.strictEqual(e.exposureProof.plateAppearances,8);
assert.strictEqual(e.roleJourney.years[0].startingRole,"bench");
assert.strictEqual(e.roleJourney.years[1].finalRole,"starter");
assert.strictEqual(e.roleJourney.years[2].finalRole,"rotation");
assert(e.positionProfile.catcher && e.performanceProof.careerQuality>0);
p.highSchoolYearThreeMatchHistory=[{matchId:"y3",actualExposure:{plateAppearances:3,defensiveInnings:5},playerContribution:{strong:0,failure:3,mixed:0}}];
const slump=Evidence.derive(p);
assert.strictEqual(slump.formalMatches.sampleCount,3);
assert(slump.performanceProof.careerQuality>0 && slump.performanceProof.recentQuality<e.performanceProof.recentQuality);
p.highSchoolYearThreeMatchHistory=[{matchId:"y3",actualExposure:{plateAppearances:0,defensiveInnings:0},playerContribution:{strong:0,failure:0}}];
assert.strictEqual(Evidence.derive(p).performanceProof.sampleCount,2,"no appearance is not performance sample");
p.highSchoolYearThreeMatchHistory=[{matchId:"y1",actualExposure:{plateAppearances:99}}];
assert.strictEqual(Evidence.derive(p).formalMatches.sampleCount,2,"deduplicates match identity");
assert.strictEqual(Evidence.derive(p).evidenceIdentity,Evidence.derive(p).evidenceIdentity);
console.log("High School Career Evidence: 12 assertions passed.");
module.exports={fixture};
