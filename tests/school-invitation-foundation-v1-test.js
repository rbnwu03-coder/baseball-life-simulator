const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console, module: { exports: {} } });
["player.js", "save.js"].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
vm.runInContext(`
  const __schoolProfiles = ["ordinary", "defense", "batting", "low"];
  function __schoolPlayer(profile="ordinary", seed=1, position="二壘手", throws="R") {
    const target=createRepresentativeHighSchoolEntryFixture(profile,seed);
    target.throws=throws;
    applyCanonicalPositionProfile(target,position,[]);
    target.schoolInvitationState=createDefaultSchoolInvitationState();
    return target;
  }
  function __schoolClone(target) {
    const clone=normalizeSave(JSON.parse(JSON.stringify(target)));
    clone.schoolInvitationState=createDefaultSchoolInvitationState();
    return clone;
  }
`, context);

const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("1. School Invitation 使用獨立 v1 version contract", evaluate(`SCHOOL_INVITATION_VERSION==="school-invitation-v1"`));
verify("2. 四個 tier 與五個 recruiting preferences 都是 stable ids", evaluate(`JSON.stringify(SCHOOL_INVITATION_TIERS)===JSON.stringify(["powerhouse","competitive","standard","development"])&&SCHOOL_RECRUITING_PREFERENCES.length===5`));

const contractState = parse(`generateSchoolInvitationSet(__schoolPlayer("ordinary",70001),{generationSeed:"contract-seed"})`);
verify("3. 合法 HS-entry player 永遠取得 exactly 4 invitations", contractState.invitations.length === 4);
verify("4. 四校 id 與名稱均唯一", new Set(contractState.invitations.map(item => item.schoolId)).size === 4 && new Set(contractState.invitations.map(item => item.schoolName)).size === 4);
verify("5. 四校不是重複 object identity", evaluate(`(() => {const p=__schoolPlayer("ordinary",70002);const s=generateSchoolInvitationSet(p,{generationSeed:"identity"});return new Set(s.invitations).size===4;})()`));
verify("6. School Profile required fields 全部合法", evaluate(`(() => {const p=__schoolPlayer("ordinary",70003);return generateSchoolInvitationSet(p,{generationSeed:"profile"}).invitations.every(s=>validateSchoolProfile(s).ok);})()`));
verify("7. Invitation derive fields 全部合法", contractState.invitations.every(item =>
  Number.isFinite(item.schoolInterest.score)
  && ["veryHigh", "high", "moderate", "limited"].includes(item.schoolInterest.category)
  && ["depthCandidate", "benchCandidate", "rotationCandidate", "starterCompetition", "coreCandidate"].includes(item.projectedRole)
  && Array.isArray(item.interestReasons) && item.interestReasons.length >= 2
  && Array.isArray(item.riskSignals)
));
verify("8. Tier metadata 保持 training／competition／playing-time 非鏡像 tradeoff", evaluate(`SCHOOL_TIER_PROFILES.powerhouse.trainingQuality==="elite"&&SCHOOL_TIER_PROFILES.powerhouse.playingTimeOpportunity==="low"&&SCHOOL_TIER_PROFILES.development.trainingQuality==="limited"&&SCHOOL_TIER_PROFILES.development.playingTimeOpportunity==="high"`));
verify("9. Powerhouse recruiting standard 高於 Standard", evaluate(`SCHOOL_TIER_PROFILES.powerhouse.recruitingStandard>SCHOOL_TIER_PROFILES.standard.recruitingStandard`));

verify("10. 未完成 Capability Settlement 時 fail loudly", evaluate(`(() => {const p=createInitialPlayer("invalid");try{generateSchoolInvitationSet(p,{generationSeed:"invalid"});return false}catch(error){return /前置條件失敗/.test(error.message);}})()`));
verify("11. Stronger relevant capability 對同校 match 不會變差", evaluate(`(() => {const a=__schoolPlayer("ordinary",70011),b=__schoolPlayer("ordinary",70011);b.baseballSkills.reaction+=2;b.baseballSkills.range+=2;const school=createSchoolProfile("same-school","competitive",0);return calculateSchoolCapabilityMatch(b,school).score>=calculateSchoolCapabilityMatch(a,school).score;})()`));
verify("12. Defense-first 與 offense-first weighting 對 profile 有不同結果", evaluate(`(() => {const p=__schoolPlayer("defense",70012);const d=createSchoolProfile("preference-d","standard",0),o=createSchoolProfile("preference-o","standard",0);d.recruitingPreference="defenseFirst";o.recruitingPreference="offenseFirst";return deriveSchoolInterest(p,d).preferenceFit>deriveSchoolInterest(p,o).preferenceFit;})()`));
verify("13. High position need 提高同校 interest", evaluate(`(() => {const p=__schoolPlayer("ordinary",70013);p.capabilityState.positionExperience={};const low=createSchoolProfile("need-school","standard",0),high=JSON.parse(JSON.stringify(low));low.positionNeeds["2B"]="low";high.positionNeeds["2B"]="high";return deriveSchoolInterest(p,high).score>deriveSchoolInterest(p,low).score;})()`));
verify("14. High position need 的 projected role 不低於 low need", evaluate(`(() => {const rank={depthCandidate:0,benchCandidate:1,rotationCandidate:2,starterCompetition:3,coreCandidate:4};const p=__schoolPlayer("ordinary",70014);p.capabilityState.positionExperience={};const low=createSchoolProfile("role-need","standard",0),high=JSON.parse(JSON.stringify(low));low.positionNeeds["2B"]="low";high.positionNeeds["2B"]="high";const li=deriveSchoolInterest(p,low),hi=deriveSchoolInterest(p,high);return rank[deriveSchoolProjectedRole(high,hi)]>=rank[deriveSchoolProjectedRole(low,li)];})()`));
verify("15. Projected role 與 actual high-school role 使用不同欄位", !contractState.invitations.some(item => Object.hasOwn(item, "actualRole")));

verify("16. 左投內野 recruiting candidates 排除 2B／3B／SS", evaluate(`(() => {const p=__schoolPlayer("ordinary",70016,"內野手","L");const profile=getSchoolRecruitingPositionProfile(p);return profile.candidatePositions.every(pos=>["1B","P"].includes(pos))&&!profile.legalPositions.some(pos=>["2B","3B","SS"].includes(pos));})()`));
verify("17. 左投合法位置不會改玩家 handedness", evaluate(`(() => {const p=__schoolPlayer("ordinary",70017,"內野手","L");generateSchoolInvitationSet(p,{generationSeed:"lefty"});return p.throws==="L";})()`));

verify("18. Diversity validator 要求 role／competition／environment／tier 多樣性", evaluate(`(() => {const p=__schoolPlayer("ordinary",70018);const s=generateSchoolInvitationSet(p,{generationSeed:"diversity"});const d=validateSchoolInvitationSet(s).diversity;return d.roleDiversity&&d.competitionDiversity&&d.environmentDiversity&&d.tierDiversity&&d.noDominantDuplicate;})()`));
verify("19. 四校不能是四個 mechanically identical offers", new Set(contractState.invitations.map(item => [item.schoolTier, item.projectedRole, item.schoolInterest.positionNeed, item.trainingQuality, item.competitionDepth].join("|"))).size >= 2);
verify("20. Invitation schema 不建立 best／recommended／optimal school", !/bestSchool|recommendedSchool|optimalSchool/.test(JSON.stringify(contractState)));

verify("21. 相同 player＋explicit seed deepEqual", evaluate(`(() => {const a=__schoolPlayer("ordinary",70021),b=__schoolPlayer("ordinary",70021);return JSON.stringify(generateSchoolInvitationSet(a,{generationSeed:"same"}))===JSON.stringify(generateSchoolInvitationSet(b,{generationSeed:"same"}));})()`));
verify("22. 不同 school seed 有合理機會產生不同 set", evaluate(`(() => {const a=__schoolPlayer("ordinary",70022),b=__schoolPlayer("ordinary",70022);return JSON.stringify(generateSchoolInvitationSet(a,{generationSeed:"seed-a"}).invitations)!==JSON.stringify(generateSchoolInvitationSet(b,{generationSeed:"seed-b"}).invitations);})()`));
verify("23. 第二次 generation 回傳 existing set 且不 reroll", evaluate(`(() => {const p=__schoolPlayer("ordinary",70023);const first=generateSchoolInvitationSet(p,{generationSeed:"first"});const before=JSON.stringify(first);const second=generateSchoolInvitationSet(p,{generationSeed:"ignored-second"});return first===second&&before===JSON.stringify(second)&&second.generationSeed==="first";})()`));
verify("24. Save／reload invitation set 完全 identical", evaluate(`(() => {const p=__schoolPlayer("ordinary",70024);generateSchoolInvitationSet(p,{generationSeed:"reload"});const before=JSON.stringify(p.schoolInvitationState);const restored=normalizeSave(JSON.parse(JSON.stringify(p)));return before===JSON.stringify(restored.schoolInvitationState);})()`));
verify("25. Reload 後再次 generate 仍不 reroll", evaluate(`(() => {let p=__schoolPlayer("ordinary",70025);generateSchoolInvitationSet(p,{generationSeed:"persist"});p=normalizeSave(JSON.parse(JSON.stringify(p)));const before=JSON.stringify(p.schoolInvitationState);return before===JSON.stringify(generateSchoolInvitationSet(p,{generationSeed:"new-seed"}));})()`));

verify("26. Generation 不呼叫 Math.random", evaluate(`(() => {const p=__schoolPlayer("ordinary",70026);let calls=0;const original=Math.random;Math.random=()=>{calls+=1;return .5};generateSchoolInvitationSet(p,{generationSeed:"no-random"});Math.random=original;return calls===0;})()`));
verify("27. Generation 不修改 Match RNG state", evaluate(`(() => {const p=__schoolPlayer("ordinary",70027);p.highSchoolMatch.simulationSeed=98765;p.highSchoolMatch.simulationCursor=37;generateSchoolInvitationSet(p,{generationSeed:"rng-isolation"});return p.highSchoolMatch.simulationSeed===98765&&p.highSchoolMatch.simulationCursor===37;})()`));
verify("28. Generation 不修改 capability／Youth／Player stats", evaluate(`(() => {const p=__schoolPlayer("ordinary",70028);const before=JSON.stringify([p.characterGenesis,p.capabilityState,p.baseballSkills,p.ballSense,p.observe,p.fitness,p.flags,p.relationships]);generateSchoolInvitationSet(p,{generationSeed:"no-mutation"});return before===JSON.stringify([p.characterGenesis,p.capabilityState,p.baseballSkills,p.ballSense,p.observe,p.fitness,p.flags,p.relationships]);})()`));
verify("29. Identity flags 不直接改同 seed School Interest", evaluate(`(() => {const a=__schoolPlayer("ordinary",70029),b=__schoolPlayer("ordinary",70029);a.flags.push("challengePower","playingTimePriority");return JSON.stringify(generateSchoolInvitationSet(a,{generationSeed:"identity-neutral"}).invitations)===JSON.stringify(generateSchoolInvitationSet(b,{generationSeed:"identity-neutral"}).invitations);})()`));

verify("30. Pre-HS legacy save 可 load 且在 settlement 後 deterministic generate", evaluate(`(() => {const raw={saveVersion:14,name:"Legacy Youth",age:15,chapter:"青少棒分化",idealSelf:"全能型",primaryPosition:"內野手",baseballSkills:{batting:3,baseRunning:3,baseballIQ:3}};const a=normalizeSave(JSON.parse(JSON.stringify(raw))),b=normalizeSave(JSON.parse(JSON.stringify(raw)));a.age=16;b.age=16;settleHighSchoolEntryCapability(a,{originType:"legacy-pre-hs-entry"});settleHighSchoolEntryCapability(b,{originType:"legacy-pre-hs-entry"});return JSON.stringify(generateSchoolInvitationSet(a,{generationSeed:"legacy-youth"}))===JSON.stringify(generateSchoolInvitationSet(b,{generationSeed:"legacy-youth"}));})()`));
verify("31. 已進高中 legacy save load 後使用 compatibility bypass", evaluate(`(() => {const p=normalizeSave({saveVersion:14,name:"Legacy HS",age:17,chapter:"青棒第二年",idealSelf:"守備型",primaryPosition:"內野手",highSchoolRoute:"普通高中・穩定出賽",baseballSkills:{batting:4,baseRunning:3,baseballIQ:4}});return p.schoolInvitationState.bypassed===true&&p.schoolInvitationState.compatibilityMode==="legacy-existing-school"&&p.schoolInvitationState.invitations.length===0;})()`));
verify("32. Legacy bypass 不造成 capability drift", evaluate(`(() => {let p=normalizeSave({saveVersion:14,name:"Legacy Drift",age:17,chapter:"青棒",idealSelf:"全能型",primaryPosition:"外野手"});const before=JSON.stringify(p.baseballSkills);p=normalizeSave(JSON.parse(JSON.stringify(p)));return before===JSON.stringify(p.baseballSkills);})()`));
verify("33. Direct Start 建立合法四校並保存 existing test school context", evaluate(`(() => {const p=__schoolPlayer("ordinary",70033,"內野手");p.highSchoolRoute="普通高中・穩定出賽";const s=generateSchoolInvitationSet(p,{generationSeed:"direct",compatibilityMode:"direct-start-bypass"});return validateSchoolInvitationSet(s).ok&&s.bypassed===true&&s.legacyExistingSchool.schoolName===p.highSchoolRoute;})()`));
verify("34. Direct Start Invitation 不修改 capability", evaluate(`(() => {const p=__schoolPlayer("ordinary",70034);const before=JSON.stringify(getDebugCapabilitySnapshot(p));generateSchoolInvitationSet(p,{generationSeed:"direct-cap",compatibilityMode:"direct-start-bypass"});return before===JSON.stringify(getDebugCapabilitySnapshot(p));})()`));

verify("35. Debug Snapshot 完整且 read-only", evaluate(`(() => {const p=__schoolPlayer("defense",70035);generateSchoolInvitationSet(p,{generationSeed:"debug"});const before=JSON.stringify(p);const s=getSchoolInvitationDebugSnapshot(p);return Object.isFrozen(s)&&Object.isFrozen(s.schools)&&s.schools.length===4&&s.schools.every(x=>["id","tier","recruitingPreference","positionNeed","capabilityMatch","recruitingStandard","interestScore","projectedRole","trainingQuality","competitionDepth","playingTimeOpportunity","reasons","riskSignals"].every(k=>Object.hasOwn(x,k)))&&before===JSON.stringify(p);})()`));

const ideals = ["全能型", "強打型", "技巧型", "守備型", "速度型", "棒球理解型"];
const universalSkills = ["catching", "throwing", "batting", "baseRunning", "baseballIQ", "armStrength", "reaction", "range"];
const audit = [];
for (let index = 0; index < 1000; index += 1) {
  const band = index < 200 ? "low" : index < 400 ? "average" : index < 600 ? "strong" : index < 800 ? "specialist" : "ideal";
  const profile = band === "low" ? "low" : band === "specialist" ? "defense" : index % 2 ? "ordinary" : "batting";
  const target = evaluate(`__schoolPlayer(${JSON.stringify(profile)},${71000 + index},"二壘手")`);
  if (band === "low") {
    universalSkills.forEach(skill => { target.baseballSkills[skill] = Math.max(1, Math.min(3, target.baseballSkills[skill])); });
  }
  if (band === "strong") {
    Object.keys(target.baseballSkills).slice(0, 8).forEach(skill => { target.baseballSkills[skill] = Math.min(20, target.baseballSkills[skill] + 3); });
  }
  if (band === "specialist") {
    Object.assign(target.baseballSkills, { catching: 7, throwing: 7, reaction: 8, range: 8, baseballIQ: 7, batting: 2 });
  }
  if (band === "ideal") target.idealSelf = ideals[index % ideals.length];
  const state = context.generateSchoolInvitationSet(target, { generationSeed: `audit-${index}` });
  audit.push({ band, state });
}

const invitations = audit.flatMap(item => item.state.invitations);
const countBy = (items, key) => items.reduce((counts, item) => {
  const value = typeof key === "function" ? key(item) : item[key];
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {});
const lowSets = audit.filter(item => item.band === "low");
const strongSets = audit.filter(item => item.band === "strong");
const specialistSets = audit.filter(item => item.band === "specialist");
const diversityPassCount = audit.filter(item => context.validateSchoolInvitationSet(item.state).ok).length;
const duplicateSchoolSetCount = audit.filter(item => new Set(item.state.invitations.map(school => school.schoolId)).size !== 4 || new Set(item.state.invitations.map(school => school.schoolName)).size !== 4).length;
const specialistPowerhouseCases = specialistSets.filter(item => item.state.invitations.some(school => school.schoolTier === "powerhouse" && school.specializedInterest)).length;
const positionNeedChecks = Array.from({ length: 100 }, (_, index) => evaluate(`(() => {const p=__schoolPlayer("ordinary",${73000 + index});p.capabilityState.positionExperience={};const low=createSchoolProfile("need-audit-${index}","standard",0),high=JSON.parse(JSON.stringify(low));low.positionNeeds["2B"]="low";high.positionNeeds["2B"]="high";const li=deriveSchoolInterest(p,low),hi=deriveSchoolInterest(p,high);return hi.score>li.score&&({depthCandidate:0,benchCandidate:1,rotationCandidate:2,starterCompetition:3,coreCandidate:4})[deriveSchoolProjectedRole(high,hi)]>=({depthCandidate:0,benchCandidate:1,rotationCandidate:2,starterCompetition:3,coreCandidate:4})[deriveSchoolProjectedRole(low,li)];})()`));

verify("36. 1000/1000 sets 都有合法四校", audit.every(item => item.state.invitations.length === 4 && context.validateSchoolInvitationSet(item.state).ok));
verify("37. 1000-set diversity pass rate 為 100%", diversityPassCount === audit.length);
verify("38. 1000-set duplicate school rate 為 0", duplicateSchoolSetCount === 0);
verify("39. Low profile 200/200 仍有合法四校", lowSets.every(item => context.validateSchoolInvitationSet(item.state).ok));
verify("40. Strong profile 仍保留 non-powerhouse tradeoff", strongSets.every(item => item.state.invitations.some(school => school.schoolTier !== "powerhouse")));
verify("41. Specialist profile 可產生 powerhouse specialized interest", specialistPowerhouseCases > 0);
verify("42. Position need influence 100/100 成立", positionNeedChecks.every(Boolean));

const auditResult = {
  schemaVersion: evaluate("SCHOOL_INVITATION_VERSION"),
  totalSets: audit.length,
  totalInvitations: invitations.length,
  tierDistribution: countBy(invitations, "schoolTier"),
  powerhouseInvitationRate: invitations.filter(item => item.schoolTier === "powerhouse").length / invitations.length,
  projectedRoleDistribution: countBy(invitations, "projectedRole"),
  diversityPassCount,
  diversityPassRate: diversityPassCount / audit.length,
  duplicateSchoolSetCount,
  duplicateSchoolRate: duplicateSchoolSetCount / audit.length,
  lowProfileLegalSetCount: lowSets.filter(item => context.validateSchoolInvitationSet(item.state).ok).length,
  lowProfileLegalSetRate: lowSets.filter(item => context.validateSchoolInvitationSet(item.state).ok).length / lowSets.length,
  strongProfileNonPowerhouseSetCount: strongSets.filter(item => item.state.invitations.some(school => school.schoolTier !== "powerhouse")).length,
  strongProfileNonPowerhouseOfferRate: strongSets.filter(item => item.state.invitations.some(school => school.schoolTier !== "powerhouse")).length / strongSets.length,
  specialistPowerhouseCases,
  positionNeedInfluencePassRate: positionNeedChecks.filter(Boolean).length / positionNeedChecks.length,
  idealSelfProfiles: ideals
};

console.log(`\nSchool Invitation Foundation v1：${passed}/${passed} 通過`);
console.log(`SCHOOL_INVITATION_SAMPLE_JSON=${JSON.stringify(contractState.invitations.map(item => ({schoolId:item.schoolId,schoolName:item.schoolName,schoolTier:item.schoolTier,recruitingPreference:item.recruitingPreference,positionNeed:item.schoolInterest.positionNeed,interestCategory:item.schoolInterest.category,projectedRole:item.projectedRole,trainingQuality:item.trainingQuality,competitionDepth:item.competitionDepth,playingTimeOpportunity:item.playingTimeOpportunity,interestReasons:item.interestReasons,riskSignals:item.riskSignals})))}`);
console.log(`SCHOOL_INVITATION_AUDIT_JSON=${JSON.stringify(auditResult)}`);
