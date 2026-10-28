(function (root, factory) {
  "use strict";
  const current = () => typeof player === "undefined" ? null : player.highSchoolMatch;
  const api = factory(root, current);
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.MatchPitchDecisionUI = api; api.install(); }
})(typeof globalThis === "undefined" ? this : globalThis, function (root, current) {
  "use strict";
  const value = field => field?.status === "available" ? field.value : null;
  const text = x => typeof x === "string" && x.length > 0;
  const fields = ["matchId", "paId", "pitchId", "situationId"];
  const escape = x => String(x ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function createAdapter(dependencies = {}) {
    const deps = {
      read: () => root.LivePublicMatchBridge.readCurrent(), current,
      choices: m => root.getHighSchoolYearOneMatchMomentChoices(m),
      choose: (decision, moment) => root.chooseHighSchoolYearOneMatchMoment(decision, moment),
      ...dependencies
    };
    let epoch = 0, view = null;
    const inFlight = new Set();
    function beginView() {
      const projection = deps.read();
      view = { epoch: ++epoch, match: deps.current(), projection, used: false };
      return projection;
    }
    function request(routeId) {
      if (!view) return null;
      const s = view.projection.snapshot;
      return Object.freeze({ ...Object.fromEntries(fields.map(k => [k, value(s.identity?.[k])])),
        routeId, expectedMomentId: value(s.decision?.expectedMomentId), viewEpoch: view.epoch });
    }
    function submit(request) {
      const reject = (code, message = "這個選項已過期，請使用目前畫面的選項。") => ({ ok: false, code, message });
      if (!request || ![...fields, "routeId", "expectedMomentId"].every(k => text(request[k]))) return reject("INVALID_REQUEST");
      const key = JSON.stringify(fields.map(k => request[k]));
      if (inFlight.has(key)) return reject("IN_FLIGHT", "這一球正在處理，請稍候。");
      if (!view || request.viewEpoch !== view.epoch || view.used || deps.current() !== view.match) return reject("STALE_VIEW");
      let projection;
      try { projection = deps.read(); } catch (_) { return reject("PUBLIC_STATE_UNAVAILABLE"); }
      const s = projection.snapshot, m = deps.current(), situation = m?.activeSituation;
      if (!fields.every(k => value(s.identity?.[k]) === request[k])) return reject("STALE_IDENTITY");
      if (s.decision?.status !== "available" || s.decision.waiting !== true
        || value(s.decision.expectedMomentId) !== request.expectedMomentId) return reject("NOT_PRESENTED");
      if (!m || m.id !== request.matchId || m.completed || situation?.type !== "plateDecision"
        || situation.lifecycleState !== "presented" || situation.admission?.admittedToPlayer !== true
        || situation.actor?.id !== "player" || situation.situationId !== request.situationId
        || situation.contextSnapshot?.paIdentity !== request.paId
        || situation.sourcePhysicalStateRef !== request.pitchId) return reject("NOT_ADMITTED");
      const routes = value(s.decision.routes);
      const matches = Array.isArray(routes) ? routes.filter(r => r.routeId === request.routeId) : [];
      if (matches.length !== 1 || !text(matches[0].matchDecision)) return reject("ILLEGAL_ROUTE");
      // Exact identities from both authorities; labels never select gameplay.
      const choices = deps.choices(m).filter(c => c.plateDecisionRoute === request.routeId
        && c.matchDecision === matches[0].matchDecision && c.matchMomentId === request.expectedMomentId);
      if (choices.length !== 1) return reject("ROUTE_MAPPING_UNAVAILABLE");
      const submittedView = view;
      inFlight.add(key);
      submittedView.used = true;
      try {
        const accepted = deps.choose(choices[0].matchDecision, choices[0].matchMomentId);
        if (accepted !== true) { submittedView.used = false; return reject("AUTHORITY_REJECTED", "目前無法提交，請確認最新比賽畫面。"); }
        return { ok: true, code: "ACCEPTED", message: "已由原比賽處理這一球。" };
      } catch (_) {
        return reject("AUTHORITY_ERROR", "比賽處理未完成，請檢查目前狀態；不會自動重送。");
      } finally { inFlight.delete(key); }
    }
    return Object.freeze({ beginView, request, submit });
  }

  let adapter, panel, observer, shell, header, frame, supporting, contextHost, scoreboardHost, situationPanel, playerInfo;
  let notice = "", focusNext = false, wasInMatch = false, lastMatchId = null;
  const originalDisabled = new WeakMap();
  const relocated = new Map();
  function classifyView(snapshot, originalChoicesAvailable) {
    if (snapshot.decision?.status === "available") return "matchPitchView";
    if (originalChoicesAvailable) return "originalUI";
    return snapshot.decision?.status === "pending" ? "pending" : "unsupportedPresentationRoute";
  }
  function displayed(field, format = x => x) {
    const v = value(field);
    return v === null ? "—" : escape(format(v));
  }
  const pitchLabels = { ball: "壞球", calledStrike: "看球好球", swingingStrike: "揮棒落空",
    foul: "界外球", inPlay: "擊球進場", ballInPlay: "擊球進場", contact: "擊球", walk: "四壞球", strikeout: "三振" };
  const resultLabels = { out: "出局", groundout: "滾地球出局", flyout: "飛球出局", strikeout: "三振",
    walk: "四壞球保送", single: "一壘安打", double: "二壘安打", triple: "三壘安打", homeRun: "全壘打" };
  // This model only consumes the existing public projection. Missing data stays
  // missing; neither the scene nor the header reads future Match state.
  function createShellModel(projection) {
    const s = projection.snapshot, game = s.game || {};
    const accepted = projection.timeline.events.filter(e => e.type === "DECISION_ACCEPTED").at(-1);
    const paId = value(s.identity?.paId) || (!s.decision?.waiting ? accepted?.paId : null);
    const pitches = projection.timeline.events.filter(e => e.type === "PITCH_RESOLVED");
    const latest = paId ? pitches.filter(e => e.paId === paId).at(-1)
      : !s.decision?.waiting ? pitches.at(-1) : null;
    const settlements = projection.timeline.events.filter(e => e.type === "PA_SETTLED");
    const settlement = settlements.at(-1);
    const currentSettlement = !s.decision?.waiting && paId ? settlements.filter(e => e.paId === paId).at(-1) : null;
    const teams = [value(game.offenseTeam), value(game.defenseTeam)].filter(Boolean);
    return Object.freeze({
      matchId: value(s.identity?.matchId), paId,
      awayTeam: teams.find(t => t.side === "away")?.teamId || null,
      homeTeam: teams.find(t => t.side === "home")?.teamId || null,
      latest, settlement,
      // A completed previous PA belongs in the supporting record once a new
      // decision is shown, never in place of the current decision.
      currentSettlement,
      pendingResolution: Boolean(!s.decision?.waiting && accepted && !currentSettlement),
      final: value(game.gameStatus) === "final"
    });
  }
  function syncOriginalChoices(original, available) {
    if (!original) return;
    original.hidden = available;
    original.inert = available;
    for (const button of original.querySelectorAll("button")) {
      if (!originalDisabled.has(button)) originalDisabled.set(button, button.disabled);
      button.disabled = available || originalDisabled.get(button);
    }
  }
  function syncOriginalContext(story) {
    // Move existing presentation nodes, retaining their text and ownership.
    // This is below story's observed root, so it cannot schedule a render loop.
    const column = story.querySelector(".match-mode-decision-column");
    if (!column) { contextHost.replaceChildren(); return; }
    const nodes = [...column.children].filter(node => node.matches(
      ".match-current-assignment:not(.plate-approach-count), .plate-decision-context, .coach-tactical-box, .match-observable-information"));
    if (nodes.length) contextHost.replaceChildren(...nodes);
  }
  function restoreOriginalContext(story) {
    const column = story.querySelector(".match-mode-decision-column");
    if (column) column.append(...contextHost.children);
    for (const [node, marker] of relocated) {
      if (marker.isConnected) marker.replaceWith(node);
      else node.remove();
    }
    relocated.clear();
  }
  function relocateOriginal(node, host) {
    if (!node) return;
    for (const [old, marker] of relocated) if (!marker.isConnected) relocated.delete(old);
    const marker = root.document.createComment("Original Match presentation position");
    node.before(marker); relocated.set(node, marker); host.replaceChildren(node);
  }
  function syncOriginalBoard(story, game) {
    // Reuse the original cursor-bounded table and feed, including R/H/E.
    // Restore these nodes on reader failure; no second scorer is created.
    relocateOriginal(story.querySelector(".match-mode-scoreboard, .match-mode-entry"), scoreboardHost);
    relocateOriginal(story.querySelector(".match-live-feed"), shell.querySelector("#matchRecentHost"));
    const rows = [...scoreboardHost.querySelectorAll(".line-score-table tbody tr")];
    rows.forEach((row, index) => {
      const name = row.querySelector("th");
      if (!name) return;
      if (!name.dataset.teamName) name.dataset.teamName = name.textContent.trim() || "unavailable";
      name.innerHTML = '<small class="match-team-side">' + (index ? "主隊" : "客隊") + '</small>' + escape(name.dataset.teamName);
      [...row.querySelectorAll("td")].forEach((cell, i) => cell.classList.toggle("is-current-inning",
        i + 1 === value(game.inning) && (index ? "下" : "上") === value(game.half)));
    });
    const headings = scoreboardHost.querySelectorAll(".line-score-table thead th");
    return {
      eventName: scoreboardHost.querySelector(".match-information > span")?.textContent.trim(),
      awayName: rows[0]?.querySelector("th")?.dataset.teamName,
      homeName: rows[1]?.querySelector("th")?.dataset.teamName,
      innings: Math.max(0, headings.length - 4)
    };
  }
  function createVisualModel(projection, metadata = {}) {
    const game = projection.snapshot.game || {}, participants = projection.snapshot.participants || {};
    const name = v => text(v) && v !== "undefined" && v !== "null" ? v : "unavailable";
    const actor = field => { const a = value(field); return a?.id === "player" ? "你" : name(a?.name); };
    const bases = value(game.bases);
    return Object.freeze({
      eventName: name(metadata.eventName), awayName: name(metadata.awayName), homeName: name(metadata.homeName),
      pitcher: actor(participants.pitcher), batter: actor(participants.batter),
      inning: value(game.inning), half: value(game.half), innings: metadata.innings || null,
      bases: Array.isArray(bases) && bases.length === 3 ? Object.freeze(bases.map(id => id !== null)) : null,
      balls: value(game.balls), strikes: value(game.strikes), outs: value(game.outs)
    });
  }
  function countLights(label, count, max) {
    return '<div class="match-count-unit"><span>' + label + '</span><strong>' + (count ?? "—") + '</strong><div class="match-count-lights" aria-hidden="true">'
      + Array.from({ length: max }, (_, i) => '<i class="' + (count !== null && i < count ? "is-on" : "") + '"></i>').join("") + '</div></div>';
  }
  function describeChoice(choice) {
    if (choice.strategicTradeoff || choice.tradeoff) return choice.strategicTradeoff || choice.tradeoff;
    const risk = { high: "高", medium: "中", low: "低" }[choice.riskProfile];
    return risk ? "原策略風險：" + risk : "";
  }
  function showOriginalTradeoffs(original) {
    if (!original) return;
    // Decorate existing legal choices; preserve their handlers and labels.
    const choices = root.getHighSchoolYearOneMatchMomentChoices(current());
    const buttons = [...original.querySelectorAll("button")];
    if (choices.length !== buttons.length) return;
    choices.forEach((choice, index) => {
      const button = buttons[index], description = describeChoice(choice);
      if (!description || button.querySelector(".match-choice-readiness, .match-original-tradeoff")) return;
      const small = root.document.createElement("small"); small.className = "match-original-tradeoff";
      small.textContent = description; button.append(small);
    });
  }
  function refresh() {
    if (!panel || !adapter) return;
    const doc = root.document, keepFocus = focusNext || panel.contains(doc.activeElement);
    let projection;
    try { projection = adapter.beginView(); } catch (_) {
      // Restore the original UI if the public reader cannot supply a view.
      syncOriginalChoices(doc.querySelector("#choices .match-player-decisions"), false);
      doc.getElementById("choices").hidden = false;
      restoreOriginalContext(doc.getElementById("story"));
      panel.hidden = header.hidden = frame.hidden = scoreboardHost.hidden = situationPanel.hidden = playerInfo.hidden = true;
      shell.classList.remove("is-match"); doc.body.classList.remove("pc-match-active");
      supporting.open = true; supporting.querySelector("summary").hidden = true;
      wasInMatch = false; focusNext = false; return;
    }
    const s = projection.snapshot;
    const inMatch = typeof root.getCurrentEventId === "function"
      && root.isHighSchoolYearOneMatchEventId?.(root.getCurrentEventId());
    const active = Boolean(inMatch && s.game), model = createShellModel(projection);
    const entering = active && !wasInMatch;
    shell.classList.toggle("is-match", active);
    doc.body.classList.toggle("pc-match-active", active);
    panel.hidden = header.hidden = frame.hidden = scoreboardHost.hidden = situationPanel.hidden = playerInfo.hidden = !active;
    supporting.querySelector("summary").hidden = !active;
    if (entering) supporting.open = false;
    else if (!active) supporting.open = true;
    const original = doc.querySelector("#choices .match-player-decisions");
    const available = active && s.decision?.status === "available" && !model.final;
    syncOriginalChoices(original, available);
    doc.getElementById("choices").hidden = available;
    wasInMatch = active;
    if (!active) { restoreOriginalContext(doc.getElementById("story")); notice = ""; focusNext = false; return; }
    if (!available) showOriginalTradeoffs(original);
    if (lastMatchId !== model.matchId) { notice = ""; lastMatchId = model.matchId; }
    syncOriginalContext(doc.getElementById("story"));
    const metadata = syncOriginalBoard(doc.getElementById("story"), s.game);
    const visual = createVisualModel(projection, metadata);
    const support = classifyView(s, Boolean(original?.querySelector("button")));
    const prompt = model.final ? "比賽結束，查看正式結算"
      : available ? "輪到你打擊：選擇這一球的應對。"
        : s.decision.waiting ? support === "originalUI" ? "你的決定：選擇目前的應對"
          : "目前決策尚未接通畫面，請保留當前進度。"
          : original?.querySelector("button") || doc.querySelector("#choices button")
            ? model.pendingResolution ? "本球已處理，依下方選項繼續揭露" : "結果已公開，依下方選項繼續"
            : "場上進行中，輪到你時會停下來";
    const bases = value(s.game.bases);
    const baseText = Array.isArray(bases) ? bases.map((id, i) => ["一壘", "二壘", "三壘"][i] + (id === null ? " 空壘" : " 有人")).join(" · ") : "壘包尚未公開";
    const latest = model.latest, settled = model.currentSettlement;
    const pitchFeedback = latest ? "第 " + escape(latest.facts.pitchNumber) + " 球：" + escape(pitchLabels[latest.facts.pitchResult] || latest.facts.pitchResult)
      + "（" + escape(latest.facts.countAfter?.balls ?? "—") + " 壞球、" + escape(latest.facts.countAfter?.strikes ?? "—") + " 好球）"
      + (latest.facts.observed?.pitchType ? " · " + escape(latest.facts.observed.pitchType) : "")
      + (Number.isFinite(latest.facts.observed?.velocity) ? " · " + escape(latest.facts.observed.velocity) + " km/h" : "")
      : model.pendingResolution ? "這球的結果等待原比賽公開。請依下方選項繼續。" : "尚無已公開的逐球結果。";
    const inningText = model.final ? "終場" : displayed(s.game.inning) + ' 局' + displayed(s.game.half);
    header.innerHTML = '<div class="match-shell-title"><strong>青棒賽事</strong><span>' + escape(visual.eventName) + '</span></div>'
      + '<div class="match-game-progress"><span>' + (model.final ? "比賽結束" : "比賽進度") + '</span><strong>' + inningText + '</strong>'
      + (visual.innings ? '<small>正規 ' + escape(visual.innings) + ' 局</small>' : '') + '</div>';
    const basesMarkup = [2, 1, 0].map(i => '<i class="match-base base-' + i + (visual.bases?.[i] ? ' is-occupied' : '')
      + '" aria-label="' + ["一壘", "二壘", "三壘"][i] + (visual.bases ? visual.bases[i] ? "有人" : "空壘" : " unavailable") + '"></i>').join("");
    situationPanel.querySelector(".match-situation-live").innerHTML = '<div class="match-inning-heading"><strong>' + inningText + '</strong><small>'
      + (model.final ? "正式結果" : value(s.game.half) === "上" ? "客隊進攻" : value(s.game.half) === "下" ? "主隊進攻" : "unavailable") + '</small></div>'
      + '<div class="match-current-score"><div><small>客隊</small><span>' + escape(visual.awayName) + '</span><strong>' + displayed(s.game.awayScore)
      + '</strong></div><b>:</b><div><small>主隊</small><span>' + escape(visual.homeName) + '</span><strong>' + displayed(s.game.homeScore) + '</strong></div></div>'
      + '<div class="match-bases-row"><div class="match-base-diamond" aria-label="壘包狀態">' + basesMarkup + '</div><p>' + escape(baseText) + '</p></div>'
      + '<div class="match-bso">' + countLights("B", visual.balls, 4) + countLights("S", visual.strikes, 3) + countLights("O", visual.outs, 3) + '</div>';
    const card = (title, initial, actorName, field) => '<section class="match-player-card"><div class="match-player-card-heading"><strong>' + title
      + '</strong><small>正式名單</small></div><div class="match-player-card-body"><div class="match-avatar" aria-label="肖像 unavailable">' + initial
      + '</div><div><strong>' + escape(actorName) + '</strong><small>' + displayed(field, a => a.defensivePosition || "unavailable")
      + '</small><small>肖像 unavailable</small></div></div></section>';
    playerInfo.innerHTML = card("投手", "P", visual.pitcher, s.participants.pitcher) + card("打者", "B", visual.batter, s.participants.batter)
      + '<section class="match-current-context"><small>當前局面</small><strong>' + inningText + ' · ' + displayed(s.game.outs) + ' 出局</strong><p>' + escape(baseText) + '</p></section>';
    frame.querySelector(".match-scene-event").textContent = available ? "投打對峙 · 等待你的判斷"
      : model.final ? "比賽結束" : s.decision.waiting ? "目前情境 · 等待你的決定" : "原比賽進行中";
    frame.querySelector(".match-result-visual").textContent = latest ? pitchLabels[latest.facts.pitchResult] || latest.facts.pitchResult : "";
    panel.dataset.decisionStatus = model.final ? "final" : s.decision.status;
    panel.dataset.support = support;
    panel.dataset.pitchId = value(s.identity.pitchId) || "";
    panel.innerHTML = '<h2 tabindex="-1" id="matchPitchPrompt">' + prompt + '</h2>'
      + '<div class="match-pitch-actions" role="group" aria-label="這一球的合法選項"></div>'
      + '<div class="match-pitch-feedback" role="status" aria-live="polite" tabindex="-1">'
      + (notice ? '<p>' + escape(notice) + '</p>' : '') + '<p>' + pitchFeedback + '</p>'
      + (settled ? '<p>最近正式打席：' + escape(resultLabels[settled.facts.result] || settled.facts.result || "已結束") + '。請依原畫面繼續。</p>' : "") + '</div>';
    if (available) for (const route of value(s.decision.routes) || []) {
      const button = doc.createElement("button"), captured = adapter.request(route.routeId);
      button.type = "button"; button.dataset.matchRoute = route.routeId;
      button.innerHTML = '<strong>' + escape(route.text || route.routeId) + '</strong><small>' + escape(route.tradeoff || "") + '</small>';
      button.addEventListener("keydown", event => {
        if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault();
      });
      button.addEventListener("click", event => {
        // A native second click can hit a newly rendered next-pitch button.
        // It remains the same double-click gesture, never a new decision.
        if (event.detail > 1) return;
        panel.querySelectorAll("button").forEach(b => { b.disabled = true; });
        const result = adapter.submit(captured);
        notice = result.message;
        focusNext = true;
        refresh();
      });
      panel.querySelector(".match-pitch-actions").append(button);
    }
    if (keepFocus) { panel.querySelector("#matchPitchPrompt").focus({ preventScroll: true }); focusNext = false; }
    if (entering) root.scrollTo({ top: 0, behavior: "instant" });
  }
  function install() {
    const doc = root.document;
    if (observer || !doc?.createElement || typeof root.MutationObserver !== "function") return false;
    const story = doc.getElementById("story"), choices = doc.getElementById("choices");
    if (!story || !choices) return false;
    adapter = createAdapter();
    shell = doc.createElement("div"); shell.id = "matchShell";
    shell.innerHTML = '<header id="matchShellHeader" class="match-shell-header" aria-label="賽事與進度" hidden></header>'
      + '<section id="matchScoreboardHost" aria-label="完整逐局計分板" hidden></section>'
      + '<aside id="matchSituationPanel" class="match-situation-panel" aria-label="比賽資訊" hidden><div class="match-situation-live"></div>'
      + '<div id="matchRecentHost"></div><details class="match-shell-context"><summary>情境與策略線索</summary><div id="matchShellContext"></div></details></aside>'
      + '<section id="matchPresentationHost" class="match-main-frame" aria-label="比賽主畫框" hidden>'
      + '<div class="match-scene" aria-label="本壘後方投打空間，中性人物佔位，尚未完成美術"><img class="match-field-layer" src="assets/g3-match/field.svg" alt="" data-scene-layer="field">'
      + '<div class="match-stage-actors"><div class="match-scene-pitcher" data-scene-layer="pitcher"><img src="assets/g3-match/pitcher-neutral.svg" alt="投手中性佔位"></div>'
      + '<div class="match-scene-batter" data-scene-layer="batter"><img src="assets/g3-match/batter-neutral.svg" alt="打者中性佔位"></div>'
      + '<div class="match-scene-catcher" data-scene-layer="catcher"><img src="assets/g3-match/catcher-neutral.svg" alt="捕手中性佔位"></div>'
      + '<div class="match-k-zone" data-scene-layer="zone" aria-label="好球帶中性示意，未提供位置資訊"><span>K-ZONE</span></div></div>'
      + '<div id="matchPhaserMount" aria-hidden="true" data-owner="presentation-only"></div><p class="match-scene-event"></p>'
      + '<div class="match-result-visual" data-scene-layer="published-result" aria-hidden="true"></div>'
      + '<p class="match-scene-note">2D 構圖研究 · 人物為中性佔位，美術未完成 · K-Zone 非實際落點</p></div></section>'
      + '<aside id="matchPlayerInfo" class="match-player-info" aria-label="投打球員與局面" hidden></aside>'
      + '<section id="matchDecisionFrame" class="match-decision-frame" aria-label="目前操作"><section id="matchPitchDecision" class="match-pitch-decision" aria-labelledby="matchPitchPrompt" hidden></section></section>'
      + '<details id="matchSupportingFrame" class="match-supporting-frame" open><summary hidden>比賽紀錄與完整情境</summary></details>';
    story.before(shell);
    header = shell.querySelector("#matchShellHeader"); frame = shell.querySelector("#matchPresentationHost");
    panel = shell.querySelector("#matchPitchDecision"); supporting = shell.querySelector("#matchSupportingFrame");
    contextHost = shell.querySelector("#matchShellContext");
    scoreboardHost = shell.querySelector("#matchScoreboardHost"); situationPanel = shell.querySelector("#matchSituationPanel");
    playerInfo = shell.querySelector("#matchPlayerInfo");
    shell.querySelector("#matchDecisionFrame").append(choices);
    supporting.append(story);
    const changeLog = doc.getElementById("changeLog");
    if (changeLog) shell.append(changeLog);
    choices.addEventListener("click", event => {
      if (shell.classList.contains("is-match") && event.target.closest("button")) focusNext = true;
    }, true);
    // Original render/reload retains ownership. Observing only these roots
    // avoids reacting to our own panel render or inventing a gameplay clock.
    observer = new root.MutationObserver(refresh);
    observer.observe(story, { childList: true });
    observer.observe(choices, { childList: true });
    refresh();
    return true;
  }
  return Object.freeze({ createAdapter, classifyView, createShellModel, createVisualModel, describeChoice, install, refresh });
});
