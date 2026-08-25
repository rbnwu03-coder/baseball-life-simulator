const MatchDevelopmentSettlementPresentation = (() => {
  "use strict";

  const VERSION = "match-development-settlement-presentation-v1";
  const MAX_VISIBLE_CONTEXTS = 3;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getSkillLabel(skill, labels = {}) {
    return typeof labels[skill] === "string" && labels[skill].trim() ? labels[skill].trim() : "這項能力";
  }

  function getQualityText(quality) {
    return {
      low: "這次經驗較偏熟悉與維持。",
      normal: "這次累積了一些實戰經驗。",
      valuable: "這次情境帶來了明顯的學習。",
      highValue: "這次經驗留下了很深的實戰印象。"
    }[quality] || "這次累積了一些實戰經驗。";
  }

  function isSuccessfulOutcome(evidence) {
    const result = String(evidence?.outcomeEvidence?.result || "").toLowerCase();
    if (evidence?.outcomeEvidence?.objectiveSucceeded === true) return true;
    if (evidence?.participationType === "batter") return /hit|safe|walk/.test(result) && !result.includes("strikeout");
    return /singleout|doubleplay|forceout|tagout/.test(result);
  }

  function buildLearningExplanation(context, evidence, exposure) {
    const targetSkill = context.targetSkill || "";
    const related = evidence.filter(item => item?.skillEvidence?.targetSkill === targetSkill);
    const active = related.filter(item => item.evidenceType === "active");
    const decisions = active.map(item => item.decisionEvidence?.quality).filter(Boolean);
    const executions = active.map(item => item.executionEvidence?.quality).filter(Boolean);
    const strongDecisionWeakExecution = decisions.includes("strong") && executions.some(value => ["weak", "failed"].includes(value));
    if (strongDecisionWeakExecution) return "你讀對了局面，但執行仍有修正空間。";

    const questionableDecisionStrongExecution = decisions.some(value => ["poor", "questionable"].includes(value))
      && executions.includes("strong") && active.some(isSuccessfulOutcome);
    if (questionableDecisionStrongExecution) return "執行成功救回了結果，但這次局面判斷仍留下值得修正的地方。";

    if (!active.length) return "實際上場讓你累積了局面熟悉度，但這次較偏熟悉與維持。";

    if (context.metadata?.experienceQuality === "highValue" && Number(exposure.defensiveInnings) <= 2) {
      return "雖然上場時間不長，但這次關鍵處理留下了明顯的實戰經驗。";
    }

    const hasCorrectiveExecution = active.some(item => ["weak", "failed"].includes(item.executionEvidence?.quality))
      || context.metadata?.reasons?.includes?.("correctiveExecutionFeedback");
    if (hasCorrectiveExecution) return "處理沒有完全成功，但這次經驗讓你找到下一次需要修正的技術環節。";

    return {
      batting: "面對實戰球路時，你累積了新的擊球調整經驗。",
      baseballIQ: "你對局面判讀與選擇累積了更多實戰理解。",
      throwing: "實戰中的處理讓你進一步整理出手節奏。",
      catching: "實際接球與控制讓動作穩定度得到進一步整理。",
      reaction: "球進入守備範圍時，你對第一步啟動有了更清楚的感受。",
      range: "移動到接球位置的過程，讓你累積了守備範圍的實戰判斷。"
    }[targetSkill] || "這次出賽留下了可供之後固定的實戰經驗。";
  }

  function createViewModel(match = {}, options = {}) {
    const labels = options.skillLabels || {};
    const state = match?.matchExperience;
    const settled = state?.settled === true;
    const evidence = settled && Array.isArray(state.evidence) ? state.evidence.map(clone) : [];
    const contexts = settled && Array.isArray(state.selectedContexts)
      ? state.selectedContexts.slice(0, MAX_VISIBLE_CONTEXTS).map(clone) : [];
    const results = settled && Array.isArray(state.developmentResults) ? state.developmentResults.map(clone) : [];
    const exposure = {
      defensiveInnings: Math.max(0, Math.floor(Number(state?.exposure?.defensiveInnings) || 0)),
      plateAppearances: Math.max(0, Math.floor(Number(state?.exposure?.plateAppearances) || 0))
    };
    const defensivePlayIds = new Set(evidence.filter(item => item.evidenceType === "active" && item.participationType !== "batter")
      .map(item => item.playId).filter(Boolean));
    const activeEvidenceCount = evidence.filter(item => item.evidenceType === "active").length;
    const participated = exposure.defensiveInnings > 0 || exposure.plateAppearances > 0 || activeEvidenceCount > 0;

    const learning = contexts.map((context, index) => {
      const result = results.find(item => item.settlementId && item.settlementId === context.settlementId)
        || results.find(item => item.targetSkill === context.targetSkill)
        || results[index] || null;
      const quality = context.metadata?.experienceQuality || "normal";
      return {
        targetSkill: context.targetSkill || "",
        label: getSkillLabel(context.targetSkill, labels),
        quality,
        qualityText: getQualityText(quality),
        explanation: buildLearningExplanation(context, evidence, exposure),
        progressOnly: Number(result?.progressGained) > 0 && Number(result?.levelUps) === 0,
        result: result ? clone(result) : null
      };
    });

    const breakthroughs = results.filter(result => Number(result?.levelUps) > 0 || result?.skillCapReached === true)
      .slice(0, MAX_VISIBLE_CONTEXTS)
      .map(result => ({
        targetSkill: result.targetSkill || "",
        label: getSkillLabel(result.targetSkill, labels),
        before: Math.max(0, Number(result.skillBefore) || 0),
        after: Math.max(0, Number(result.skillAfter) || 0),
        levelUps: Math.max(0, Number(result.levelUps) || 0),
        skillCapReached: result.skillCapReached === true
      }));
    const hasProgress = results.some(result => Number(result?.progressGained) > 0);

    return deepFreeze({
      version: VERSION,
      available: settled,
      matchId: String(match?.id || ""),
      settlementId: settled ? String(state.matchExperienceSettlementId || "") : "",
      participation: {
        ...exposure,
        defensivePlays: defensivePlayIds.size,
        activeParticipation: activeEvidenceCount,
        participated
      },
      learning,
      breakthroughs,
      hasProgress,
      contextOverflow: settled && Array.isArray(state.selectedContexts) && state.selectedContexts.length > MAX_VISIBLE_CONTEXTS
    });
  }

  function renderParticipation(model) {
    if (!model.available) return `<p class="match-development-empty">本場未產生可結算的實戰成長資料。</p>`;
    if (!model.participation.participated) return `<p class="match-development-empty">本場沒有實際上場，因此沒有形成直接的實戰成長。</p>`;
    return `<dl class="match-development-participation">
      <div><dt>守備</dt><dd>${model.participation.defensiveInnings} 局</dd></div>
      <div><dt>打席</dt><dd>${model.participation.plateAppearances}</dd></div>
      <div><dt>守備處理</dt><dd>${model.participation.defensivePlays} 次</dd></div>
    </dl>`;
  }

  function renderLearning(model) {
    if (!model.available) return `<p class="match-development-empty">沒有可供呈現的實戰經驗摘要。</p>`;
    if (!model.participation.participated) return `<p class="match-development-empty">沒有直接實戰參與，因此沒有主要實戰經驗。</p>`;
    if (!model.learning.length) return `<p class="match-development-empty">你完成了這次出賽，但這場沒有形成明顯的新技能成長。</p>`;
    return `<ol class="match-development-learning">${model.learning.map(item => `<li>
      <h4>${escapeHtml(item.label)}</h4>
      <p>${escapeHtml(item.explanation)}</p>
      <small>${escapeHtml(item.qualityText)}</small>
    </li>`).join("")}</ol>`;
  }

  function renderBreakthroughs(model) {
    if (!model.available || !model.participation.participated) {
      return `<p class="match-development-no-breakthrough">本場沒有形成新的永久能力提升。</p>`;
    }
    if (model.breakthroughs.length) return `<ul class="match-development-breakthroughs">${model.breakthroughs.map(item => `<li>
      <strong>${escapeHtml(item.label)}${item.levelUps > 0 ? ` <span>${item.before} → ${item.after}</span>` : ""}</strong>
      ${item.skillCapReached ? `<p>這項能力目前已達最高成熟度。</p>` : `<p>先前累積的經驗已固定成永久能力。</p>`}
    </li>`).join("")}</ul>`;
    if (model.hasProgress) return `<p class="match-development-no-breakthrough"><strong>已有實戰累積，但尚未形成永久能力提升。</strong></p>`;
    return `<p class="match-development-no-breakthrough">本場沒有形成新的永久能力提升，但實戰經驗已累積。</p>`;
  }

  function render(model) {
    return `<section class="post-match-section match-development-settlement" aria-labelledby="matchDevelopmentTitle">
      <h3 id="matchDevelopmentTitle">本場實戰成長</h3>
      <section class="match-development-block" aria-labelledby="matchParticipationTitle">
        <h4 id="matchParticipationTitle">本場參與</h4>
        ${renderParticipation(model)}
      </section>
      <section class="match-development-block" aria-labelledby="matchLearningTitle">
        <h4 id="matchLearningTitle">本場主要實戰經驗</h4>
        ${renderLearning(model)}
      </section>
      <section class="match-development-block match-development-result" aria-labelledby="matchBreakthroughTitle">
        <h4 id="matchBreakthroughTitle">能力成長結果</h4>
        ${renderBreakthroughs(model)}
      </section>
    </section>`;
  }

  return Object.freeze({
    VERSION,
    MAX_VISIBLE_CONTEXTS,
    createViewModel,
    render
  });
})();
