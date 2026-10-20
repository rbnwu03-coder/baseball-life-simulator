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

  let adapter, panel, observer, notice = "", focusNext = false;
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
  function refresh() {
    if (!panel || !adapter) return;
    const doc = root.document, keepFocus = focusNext || panel.contains(doc.activeElement);
    let projection;
    try { projection = adapter.beginView(); } catch (_) { panel.hidden = true; return; }
    const s = projection.snapshot;
    const inMatch = typeof root.getCurrentEventId === "function"
      && root.isHighSchoolYearOneMatchEventId?.(root.getCurrentEventId());
    panel.hidden = !inMatch || !s.game;
    const original = doc.querySelector("#choices .match-player-decisions");
    if (original) original.hidden = !panel.hidden && s.decision?.status === "available";
    if (panel.hidden) return;
    const support = classifyView(s, Boolean(original?.querySelector("button")));
    const final = value(s.game.gameStatus) === "final", available = s.decision.status === "available" && !final;
    const prompt = final ? "比賽已結束，請查看正式結算。"
      : available ? "輪到你打擊：選擇這一球的應對。"
        : s.decision.waiting ? support === "originalUI" ? "請使用下方原比賽選項，完成目前判斷。"
          : "目前決策尚未接通畫面，請保留當前進度。"
          : "比賽進行中，等待原比賽公開下一個局面。";
    const bases = value(s.game.bases);
    const baseText = Array.isArray(bases) ? bases.map((id, i) => ["一壘", "二壘", "三壘"][i] + (id === null ? " 空壘" : " 有人")).join(" · ") : "壘包尚未公開";
    const actor = field => displayed(field, a => a.id === "player" ? "你" : a.name || "球員");
    const pitches = projection.timeline.events.filter(e => e.type === "PITCH_RESOLVED").slice(-3);
    const latest = pitches.at(-1);
    const settled = projection.timeline.events.filter(e => e.type === "PA_SETTLED").at(-1);
    const pitchFeedback = latest ? "第 " + escape(latest.facts.pitchNumber) + " 球：" + escape(pitchLabels[latest.facts.pitchResult] || latest.facts.pitchResult)
      + "（" + escape(latest.facts.countAfter?.balls ?? "—") + " 壞球、" + escape(latest.facts.countAfter?.strikes ?? "—") + " 好球）"
      + (latest.facts.observed?.pitchType ? " · " + escape(latest.facts.observed.pitchType) : "")
      + (Number.isFinite(latest.facts.observed?.velocity) ? " · " + escape(latest.facts.observed.velocity) + " km/h" : "") : "尚無已公開的逐球結果。";
    panel.dataset.decisionStatus = final ? "final" : s.decision.status;
    panel.dataset.support = support;
    panel.dataset.pitchId = value(s.identity.pitchId) || "";
    panel.innerHTML = '<div class="match-pitch-score"><strong>客隊 ' + displayed(s.game.awayScore)
      + ' : ' + displayed(s.game.homeScore) + ' 主隊</strong><span>' + displayed(s.game.inning) + ' 局'
      + displayed(s.game.half) + ' · ' + displayed(s.game.outs) + ' 出局</span></div>'
      + '<h2 tabindex="-1" id="matchPitchPrompt">' + prompt + '</h2>'
      + '<div class="match-pitch-count"><strong>' + displayed(s.game.balls) + ' 壞球</strong><strong>'
      + displayed(s.game.strikes) + ' 好球</strong><span>' + escape(baseText) + '</span></div>'
      + '<p class="match-pitch-actors">打者：' + actor(s.participants.batter) + '　投手：' + actor(s.participants.pitcher) + '</p>'
      + '<div class="match-pitch-actions" role="group" aria-label="這一球的合法選項"></div>'
      + '<div class="match-pitch-feedback" role="status" aria-live="polite" tabindex="-1"><p>' + escape(notice)
      + '</p><p>' + pitchFeedback + '</p>'
      + (settled ? '<p>最近正式打席：' + escape(resultLabels[settled.facts.result] || settled.facts.result || "已結束") + '。請依原畫面繼續。</p>' : "") + '</div>'
      + '<details><summary>已公開事件紀錄</summary><ol>' + projection.timeline.events.slice(-12).map(e =>
        '<li>' + escape(e.type) + (e.facts?.result ? ' · ' + escape(e.facts.result) : "") + '</li>').join("") + '</ol></details>';
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
    if (keepFocus) { panel.querySelector(".match-pitch-feedback").focus({ preventScroll: true }); focusNext = false; }
  }
  function install() {
    const doc = root.document;
    if (observer || !doc?.createElement || typeof root.MutationObserver !== "function") return false;
    const story = doc.getElementById("story"), choices = doc.getElementById("choices");
    if (!story || !choices) return false;
    adapter = createAdapter();
    panel = doc.createElement("section"); panel.id = "matchPitchDecision"; panel.className = "match-pitch-decision"; panel.hidden = true;
    panel.setAttribute("aria-labelledby", "matchPitchPrompt");
    story.before(panel);
    // Original render/reload retains ownership. Observing only these roots
    // avoids reacting to our own panel render or inventing a gameplay clock.
    observer = new root.MutationObserver(refresh);
    observer.observe(story, { childList: true });
    observer.observe(choices, { childList: true });
    refresh();
    return true;
  }
  return Object.freeze({ createAdapter, classifyView, install, refresh });
});
