const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console, module: { exports: {} } });
["player.js", "save.js"].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
vm.runInContext(`
  const __identityFlags = ["challengePower", "aspireToPower", "proveMyself", "playingTimePriority"];
  const __identityVariants = [
    { id: "neutral", flag: "", idealSelf: "全能型" },
    { id: "challengePower", flag: "challengePower", idealSelf: "強打型" },
    { id: "aspireToPower", flag: "aspireToPower", idealSelf: "技巧型" },
    { id: "proveMyself", flag: "proveMyself", idealSelf: "守備型" },
    { id: "playingTimePriority", flag: "playingTimePriority", idealSelf: "速度型" }
  ];
  function __invitationPlayer(profile="ordinary", seed=1, position="二壘手", throws="R") {
    const target=createRepresentativeHighSchoolEntryFixture(profile,seed);
    target.throws=throws;
    applyCanonicalPositionProfile(target,position,[]);
    target.schoolInvitationState=createDefaultSchoolInvitationState();
    return target;
  }
  function __objectiveClone(target) {
    const clone=JSON.parse(JSON.stringify(target));
    clone.schoolInvitationState=createDefaultSchoolInvitationState();
    return clone;
  }
  function __applyIdentityVariant(target, variant) {
    target.idealSelf=variant.idealSelf;
    target.flags=(target.flags||[]).filter(flag=>!__identityFlags.includes(flag));
    if(variant.flag) target.flags.push(variant.flag);
    target.narrativeIdentity={ id: variant.id, motivation: variant.flag || "neutral" };
    target.playerPreference=variant.flag || "neutral";
    return target;
  }
  globalThis.__identityVariantsForAudit=__identityVariants;
`, context);

const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("1. Generator 維持 School Invitation v1 persisted contract", evaluate(`SCHOOL_INVITATION_VERSION==="school-invitation-v1"`));
verify("2. Default seed 使用獨立 high-school recruiting namespace", evaluate(`SCHOOL_INVITATION_GENERATION_NAMESPACE==="high-school-entry-recruiting-cycle-v1"`));
verify("3. Default seed source 不讀 identity／motivation／relationship／preference metadata", evaluate(`(() => {const source=String(deriveSchoolInvitationGenerationSeed);return !["idealSelf","name","flags","identity","motivation","relationship","playerPreference"].some(token=>source.includes(token));})()`));
verify("4. Interest variation source 不讀 narrative identity metadata", evaluate(`(() => {const source=String(deriveSchoolInterest);return !["idealSelf","flags","identity","motivation","relationship","playerPreference"].some(token=>source.includes(token));})()`));
verify("5. Display-order source 不讀 narrative identity metadata", evaluate(`(() => {const source=String(selectSchoolInvitationCandidates);return !["idealSelf","flags","identity","motivation","relationship","playerPreference"].some(token=>source.includes(token));})()`));
verify("6. Explicit audit seed contract 仍原樣保留", evaluate(`deriveSchoolInvitationGenerationSeed(__invitationPlayer("ordinary",80006),"explicit-seed")==="explicit-seed"`));

const pairwise = parse(`(() => {
  const base=__invitationPlayer("ordinary",80010);
  const variants=__identityVariants.map(variant=>{
    const target=__applyIdentityVariant(__objectiveClone(base),variant);
    return { id:variant.id, state:generateSchoolInvitationSet(target) };
  });
  return variants.map(item=>({id:item.id,state:item.state}));
})()`);
const neutralState = pairwise[0].state;
const variantState = id => pairwise.find(item => item.id === id).state;
verify("7. challengePower vs aspireToPower invitation set deepEqual", JSON.stringify(variantState("challengePower")) === JSON.stringify(variantState("aspireToPower")));
verify("8. proveMyself vs playingTimePriority invitation set deepEqual", JSON.stringify(variantState("proveMyself")) === JSON.stringify(variantState("playingTimePriority")));
verify("9. no identity vs challengePower invitation set deepEqual", JSON.stringify(neutralState) === JSON.stringify(variantState("challengePower")));
verify("10. 五種 Identity variants 全部 deepEqual", pairwise.every(item => JSON.stringify(item.state) === JSON.stringify(neutralState)));
verify("11. Identity variants 的 default generation seed 完全相同", new Set(pairwise.map(item => item.state.generationSeed)).size === 1);
verify("12. school id／name／seed／tier／need／preference／coach 完全相同", pairwise.every(item => JSON.stringify(item.state.invitations.map(school => [school.schoolId, school.schoolName, school.schoolSeed, school.schoolTier, school.positionNeeds, school.recruitingPreference, school.coachProfile])) === JSON.stringify(neutralState.invitations.map(school => [school.schoolId, school.schoolName, school.schoolSeed, school.schoolTier, school.positionNeeds, school.recruitingPreference, school.coachProfile]))));
verify("13. interest／specialized／role／reasons／risks 完全相同", pairwise.every(item => JSON.stringify(item.state.invitations.map(school => [school.schoolInterest, school.specializedInterest, school.projectedRole, school.interestReasons, school.riskSignals])) === JSON.stringify(neutralState.invitations.map(school => [school.schoolInterest, school.specializedInterest, school.projectedRole, school.interestReasons, school.riskSignals]))));
verify("14. Invitation display order 完全相同", pairwise.every(item => item.state.invitations.map(school => school.schoolId).join("|") === neutralState.invitations.map(school => school.schoolId).join("|")));

verify("15. Identity mutation after generation 不 reroll、不 mutation、不 reorder", evaluate(`(() => {const p=__invitationPlayer("ordinary",80015);const first=generateSchoolInvitationSet(p),before=JSON.stringify(first),order=first.invitations.map(x=>x.schoolId).join("|");__applyIdentityVariant(p,__identityVariants[4]);const second=generateSchoolInvitationSet(p);return first===second&&before===JSON.stringify(second)&&order===second.invitations.map(x=>x.schoolId).join("|");})()`));
verify("16. Capability 差異仍會改變同一 school 的 recruiting evaluation", evaluate(`(() => {const low=__invitationPlayer("ordinary",80016),high=__objectiveClone(low);high.baseballSkills.catching=12;high.baseballSkills.throwing=12;high.baseballSkills.reaction=12;high.baseballSkills.range=12;high.baseballSkills.baseballIQ=12;const school=createSchoolProfile("capability-sensitivity","competitive",0);const a=deriveSchoolInterest(low,school),b=deriveSchoolInterest(high,school);return b.capabilityMatch>a.capabilityMatch&&b.score>a.score;})()`));
verify("17. 相同 character seed、不同 capability 的 candidate world 相同但結果敏感", evaluate(`(() => {const low=__invitationPlayer("ordinary",80017),high=__objectiveClone(low);Object.keys(high.baseballSkills).forEach(skill=>high.baseballSkills[skill]=Math.min(20,high.baseballSkills[skill]+7));const a=generateSchoolInvitationSet(low),b=generateSchoolInvitationSet(high);return a.generationSeed===b.generationSeed&&JSON.stringify(a.invitations.map(x=>[x.schoolInterest.score,x.projectedRole]))!==JSON.stringify(b.invitations.map(x=>[x.schoolInterest.score,x.projectedRole]));})()`));
verify("18. 合法 recruiting position profile 仍會改變 default seed", evaluate(`(() => {const a=__invitationPlayer("ordinary",80018,"二壘手"),b=__invitationPlayer("ordinary",80018,"外野手");return deriveSchoolInvitationGenerationSeed(a)!==deriveSchoolInvitationGenerationSeed(b);})()`));
verify("19. Position need／fit 仍依客觀 candidate position 改變", evaluate(`(() => {const inf=__invitationPlayer("ordinary",80019,"二壘手"),out=__invitationPlayer("ordinary",80019,"外野手"),school=createSchoolProfile("position-sensitivity","standard",0);inf.capabilityState.positionExperience={};out.capabilityState.positionExperience={};school.positionNeeds["2B"]="high";school.positionNeeds.OF="low";const a=deriveSchoolInterest(inf,school),b=deriveSchoolInterest(out,school);return a.candidatePosition==="2B"&&b.candidatePosition==="OF"&&a.positionNeed!==b.positionNeed;})()`));

verify("20. Generation 不呼叫 Math.random", evaluate(`(() => {const p=__invitationPlayer("ordinary",80020);let calls=0;const original=Math.random;Math.random=()=>{calls+=1;return .5};try{generateSchoolInvitationSet(p)}finally{Math.random=original}return calls===0;})()`));
verify("21. Generation 不消耗 Match RNG", evaluate(`(() => {const p=__invitationPlayer("ordinary",80021);p.highSchoolMatch.simulationSeed=123456;p.highSchoolMatch.simulationCursor=19;generateSchoolInvitationSet(p);return p.highSchoolMatch.simulationSeed===123456&&p.highSchoolMatch.simulationCursor===19;})()`));
verify("22. Generation 不修改 capability／Genesis／Youth outcome", evaluate(`(() => {const p=__invitationPlayer("defense",80022);const before=JSON.stringify([p.characterGenesis,p.capabilityState,p.baseballSkills]);generateSchoolInvitationSet(p);return before===JSON.stringify([p.characterGenesis,p.capabilityState,p.baseballSkills]);})()`));
verify("23. Save／reload invitation state identical", evaluate(`(() => {const p=__invitationPlayer("ordinary",80023);generateSchoolInvitationSet(p);const before=JSON.stringify(p.schoolInvitationState),restored=normalizeSave(JSON.parse(JSON.stringify(p)));return before===JSON.stringify(restored.schoolInvitationState);})()`));
verify("24. Reload 後 Identity mutation 仍回傳 saved set", evaluate(`(() => {let p=__invitationPlayer("ordinary",80024);generateSchoolInvitationSet(p);p=normalizeSave(JSON.parse(JSON.stringify(p)));const before=JSON.stringify(p.schoolInvitationState);__applyIdentityVariant(p,__identityVariants[3]);return before===JSON.stringify(generateSchoolInvitationSet(p));})()`));
verify("25. Direct Start 仍生成合法四校且保留 bypass context", evaluate(`(() => {const p=__invitationPlayer("ordinary",80025,"內野手");p.highSchoolRoute="普通高中・穩定出賽";const state=generateSchoolInvitationSet(p,{compatibilityMode:"direct-start-bypass"});return validateSchoolInvitationSet(state).ok&&state.bypassed===true&&state.legacyExistingSchool.schoolName===p.highSchoolRoute;})()`));
verify("26. Pre-HS legacy save settlement 後仍可 deterministic generate", evaluate(`(() => {const raw={saveVersion:14,name:"Legacy Youth",age:15,chapter:"青少棒分化",idealSelf:"全能型",primaryPosition:"內野手",baseballSkills:{batting:3,baseRunning:3,baseballIQ:3}};const a=normalizeSave(JSON.parse(JSON.stringify(raw))),b=normalizeSave(JSON.parse(JSON.stringify(raw)));a.age=16;b.age=16;settleHighSchoolEntryCapability(a,{originType:"legacy-pre-hs-entry"});settleHighSchoolEntryCapability(b,{originType:"legacy-pre-hs-entry"});return JSON.stringify(generateSchoolInvitationSet(a))===JSON.stringify(generateSchoolInvitationSet(b));})()`));
verify("27. Existing high-school legacy save compatibility bypass 不變", evaluate(`(() => {const p=normalizeSave({saveVersion:14,name:"Legacy HS",age:17,chapter:"青棒第二年",idealSelf:"守備型",primaryPosition:"內野手",highSchoolRoute:"普通高中・穩定出賽",baseballSkills:{batting:4,baseRunning:3,baseballIQ:4}});return p.schoolInvitationState.bypassed===true&&p.schoolInvitationState.compatibilityMode==="legacy-existing-school"&&p.schoolInvitationState.invitations.length===0;})()`));
verify("28. Debug Snapshot 將 identity 標示為 future presentation only", evaluate(`(() => {const p=__invitationPlayer("ordinary",80028);generateSchoolInvitationSet(p);const snapshot=getSchoolInvitationDebugSnapshot(p);return snapshot.narrativeIdentity.idealSelf===p.idealSelf&&snapshot.narrativeIdentity.recruitingUsage==="future-presentation-only-not-used-in-recruiting-generation"&&!Object.hasOwn(snapshot.playerCapabilitySummary,"idealSelf");})()`));

const universalSkills = ["catching", "throwing", "batting", "baseRunning", "baseballIQ", "armStrength", "reaction", "range"];
const population = [];
for (let index = 0; index < 1000; index += 1) {
  const band = index < 200 ? "low" : index < 400 ? "average" : index < 600 ? "strong" : index < 800 ? "specialist" : "identity";
  const profile = band === "low" ? "low" : band === "specialist" ? "defense" : index % 2 ? "ordinary" : "batting";
  const target = evaluate(`__invitationPlayer(${JSON.stringify(profile)},${81000 + index},"二壘手")`);
  if (band === "low") universalSkills.forEach(skill => { target.baseballSkills[skill] = Math.max(1, Math.min(3, target.baseballSkills[skill])); });
  if (band === "strong") Object.keys(target.baseballSkills).slice(0, 8).forEach(skill => { target.baseballSkills[skill] = Math.min(20, target.baseballSkills[skill] + 3); });
  if (band === "specialist") Object.assign(target.baseballSkills, { catching: 7, throwing: 7, reaction: 8, range: 8, baseballIQ: 7, batting: 2 });
  if (band === "identity") context.__applyIdentityVariant(target, context.__identityVariantsForAudit[index % context.__identityVariantsForAudit.length]);
  population.push({ band, state: context.generateSchoolInvitationSet(target) });
}
const invitations = population.flatMap(item => item.state.invitations);
const countBy = (items, key) => items.reduce((counts, item) => {
  const value = item[key];
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {});
const lowSets = population.filter(item => item.band === "low");
const strongSets = population.filter(item => item.band === "strong");
const specialistSets = population.filter(item => item.band === "specialist");
const diversityPassCount = population.filter(item => context.validateSchoolInvitationSet(item.state).ok).length;
const duplicateSchoolSetCount = population.filter(item => new Set(item.state.invitations.map(school => school.schoolId)).size !== 4 || new Set(item.state.invitations.map(school => school.schoolName)).size !== 4).length;
const specialistPowerhouseCases = specialistSets.filter(item => item.state.invitations.some(school => school.schoolTier === "powerhouse" && school.specializedInterest)).length;

verify("29. 修正後 population 1000/1000 都是合法四校", population.every(item => item.state.invitations.length === 4 && context.validateSchoolInvitationSet(item.state).ok));
verify("30. 修正後 diversity 1000/1000 PASS", diversityPassCount === 1000);
verify("31. 修正後 duplicate school sets 為 0", duplicateSchoolSetCount === 0);
verify("32. Low profile 200/200 仍合法", lowSets.every(item => context.validateSchoolInvitationSet(item.state).ok));
verify("33. Strong profile 200/200 仍有 non-powerhouse tradeoff", strongSets.every(item => item.state.invitations.some(school => school.schoolTier !== "powerhouse")));
verify("34. Specialist profile 仍有 powerhouse specialized interest case", specialistPowerhouseCases > 0);

let identityComparisons = 0;
let identityMismatches = 0;
for (let index = 0; index < 200; index += 1) {
  const base = evaluate(`__invitationPlayer(${JSON.stringify(index % 2 ? "ordinary" : "defense")},${83000 + index},${JSON.stringify(index % 3 === 0 ? "外野手" : "二壘手")})`);
  const states = context.__identityVariantsForAudit.map(variant => {
    const target = context.__applyIdentityVariant(context.__objectiveClone(base), variant);
    return JSON.stringify(context.generateSchoolInvitationSet(target));
  });
  for (let variantIndex = 1; variantIndex < states.length; variantIndex += 1) {
    identityComparisons += 1;
    if (states[variantIndex] !== states[0]) identityMismatches += 1;
  }
}
verify("35. Identity independence audit 200 players／5 variants／800 comparisons mismatch 0", identityComparisons === 800 && identityMismatches === 0);

const auditResult = {
  totalSets: population.length,
  totalInvitations: invitations.length,
  tierDistribution: countBy(invitations, "schoolTier"),
  projectedRoleDistribution: countBy(invitations, "projectedRole"),
  diversityPassCount,
  duplicateSchoolSetCount,
  lowProfileLegalSetCount: lowSets.filter(item => context.validateSchoolInvitationSet(item.state).ok).length,
  strongProfileNonPowerhouseSetCount: strongSets.filter(item => item.state.invitations.some(school => school.schoolTier !== "powerhouse")).length,
  specialistPowerhouseCases,
  identityObjectivePlayers: 200,
  identityVariants: 5,
  identityComparisons,
  identityMismatches
};

console.log(`\nSchool Invitation Foundation v1.0.1：${passed}/${passed} 通過`);
console.log(`SCHOOL_INVITATION_V101_AUDIT_JSON=${JSON.stringify(auditResult)}`);
