(() => {
  "use strict";

  let offenseApproach = "opposite";
  let fieldingApproach = "attack";
  let throwDecision = "force-lead-runner";
  let randomState = 5101;
  let pendingFielding = null;

  const $ = id => document.getElementById(id);
  const value = id => $(id).value;

  function resetRandom() {
    const parsed = Number.parseInt(value("prototypeSeed"), 10);
    randomState = Number.isFinite(parsed) ? parsed >>> 0 : 5101;
    if (randomState === 0) randomState = 0x6d2b79f5;
  }

  function nextRandom() {
    let state = randomState >>> 0;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    randomState = state >>> 0;
    return randomState / 4294967296;
  }

  function offenseRolls() {
    return { execution: nextRandom(), battedBall: nextRandom(), defense: nextRandom(), result: nextRandom(), runnerAdvance: nextRandom() };
  }

  function defenseRolls() {
    return { fieldingExecution: nextRandom(), fieldingResult: nextRandom(), throwExecution: nextRandom(), result: nextRandom() };
  }

  function offenseInput(rolls) {
    return {
      situation: { scoreState: value("offScore"), runnerSpeed: value("offRunner"), pitcherTendency: value("offPitcher") },
      player: { power: value("offPower"), contact: value("offContact"), bunt: value("offBunt"), body: value("offBody"), nextBatterReliability: value("offNext") },
      approach: offenseApproach,
      pitchDifficulty: value("offDifficulty"),
      defenseQuality: value("offDefense"),
      rolls
    };
  }

  function defenseInput(rolls, chosenThrow = throwDecision) {
    return {
      situation: {
        ballType: value("defBallType"),
        ballDifficulty: value("defDifficulty"),
        batterSpeed: value("defBatter"),
        runnerSpeed: value("defRunner"),
        scoreState: value("defScore")
      },
      player: { fielding: value("defFielding"), throwing: value("defThrowing"), body: value("defBody") },
      fieldingApproach,
      throwDecision: chosenThrow,
      rolls
    };
  }

  function card(label, content) {
    return `<div class="result-card"><span>${label}</span><strong>${content}</strong></div>`;
  }

  function renderOffense(result) {
    if (result.status !== "resolved") {
      $("offenseResult").innerHTML = card("Unresolved", result.issues.map(item => item.code).join(", "));
      $("offenseTrace").textContent = JSON.stringify(result, null, 2);
      return;
    }
    $("offenseResult").innerHTML = [
      card("Decision Quality", `${result.decision.quality}（raw ${result.decision.rawScore}）`),
      card("Execution", `${result.execution.tier}（${result.execution.score}）`),
      card("Batted Ball", result.battedBall ? result.battedBall.profile : "不適用"),
      card("Defense Interaction", result.defense ? result.defense.tier : "不適用"),
      card("Final Result", result.result.resultType),
      card("New Game State", JSON.stringify(result.result.stateDelta))
    ].join("");
    $("offenseTrace").textContent = JSON.stringify(result.trace, null, 2);
  }

  function countBy(results, getter) {
    return results.reduce((counts, result) => {
      const key = getter(result) || "unavailable";
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function summaryBlock(title, counts) {
    return `<h4>${title}</h4><ul>${Object.entries(counts).map(([key, total]) => `<li>${key}: ${total}</li>`).join("")}</ul>`;
  }

  function runOffenseOnce() {
    const result = BaseballOffensePrototype.resolveAtBat(offenseInput(offenseRolls()));
    renderOffense(result);
    $("offenseSummary").innerHTML = "";
  }

  function runOffenseTen() {
    const results = Array.from({ length: 10 }, () => BaseballOffensePrototype.resolveAtBat(offenseInput(offenseRolls())));
    renderOffense(results[results.length - 1]);
    $("offenseSummary").innerHTML = [
      summaryBlock("Decision Quality distribution", countBy(results, result => result.decision && result.decision.quality)),
      summaryBlock("Execution distribution", countBy(results, result => result.execution && result.execution.tier)),
      summaryBlock("Result distribution", countBy(results, result => result.result && result.result.resultType))
    ].join("");
    $("offenseTrace").textContent = JSON.stringify({ runs: results.map(result => ({ rolls: result.input.rolls, decision: result.decision.quality, execution: result.execution.tier, result: result.result.resultType })) }, null, 2);
  }

  function fieldingDecisionInput(roll) {
    return {
      ballType: value("defBallType"),
      ballDifficulty: value("defDifficulty"),
      batterSpeed: value("defBatter"),
      fielding: value("defFielding"),
      body: value("defBody"),
      fieldingApproach,
      executionRoll: roll
    };
  }

  function setThrowStage(enabled, control) {
    $("throwStage").classList.toggle("disabled-stage", !enabled);
    $("throwStage").setAttribute("aria-disabled", String(!enabled));
    $("controlCarry").textContent = enabled ? `Stage A Control Quality：${control}（由接球結果帶入）` : "先完成 Stage A；Control Quality 不可由玩家任意改寫。";
  }

  function clearThrowOutcome() {
    $("defenseResult").innerHTML = "";
    $("defenseSummary").innerHTML = "";
  }

  function runFielding() {
    clearThrowOutcome();
    const rolls = defenseRolls();
    const decisionInput = fieldingDecisionInput(rolls.fieldingExecution);
    $("defThrowBatter").value = decisionInput.batterSpeed;
    const decision = BaseballDefensePrototype.resolveFieldingDecision(decisionInput);
    if (decision.status !== "resolved") {
      $("fieldingResult").innerHTML = card("Unresolved", decision.issues[0].code);
      setThrowStage(false);
      pendingFielding = null;
      return;
    }
    const execution = BaseballDefensePrototype.resolveFieldingExecution({
      ballDifficulty: decisionInput.ballDifficulty,
      fielding: decisionInput.fielding,
      body: decisionInput.body,
      decisionQuality: decision.quality,
      executionRoll: rolls.fieldingExecution
    });
    $("fieldingResult").innerHTML = [
      card("Decision Quality", `${decision.quality}（raw ${decision.rawScore}）`),
      card("Execution", `${execution.tier}（${execution.score}）`),
      card("Control Quality", execution.controlQuality)
    ].join("");
    pendingFielding = { rolls, controlQuality: execution.controlQuality };
    setThrowStage(execution.controlQuality !== "failed", execution.controlQuality);
    $("defenseTrace").textContent = JSON.stringify(decision.trace.concat(execution.trace), null, 2);
  }

  function runDefenseOnce() {
    if (!pendingFielding || pendingFielding.controlQuality === "failed") return;
    const rolls = Object.assign({}, pendingFielding.rolls, { throwExecution: nextRandom(), result: nextRandom() });
    const result = BaseballDefensePrototype.resolveDefensivePlay(defenseInput(rolls));
    renderDefense(result);
    $("defenseSummary").innerHTML = "";
  }

  function renderDefense(result) {
    if (result.status !== "resolved") {
      $("defenseResult").innerHTML = card("Unresolved", result.issues.map(item => item.code).join(", "));
      $("defenseTrace").textContent = JSON.stringify(result, null, 2);
      return;
    }
    $("defenseResult").innerHTML = [
      card("Throw Decision Quality", result.throwDecision.quality || result.throwDecision.status),
      card("Throw Execution", result.throwExecution ? `${result.throwExecution.tier}（${result.throwExecution.score}）` : "unavailable"),
      card("Final Result", result.result.resultType),
      card("New Game State", JSON.stringify(result.stateDelta))
    ].join("");
    $("defenseTrace").textContent = JSON.stringify(result.trace, null, 2);
  }

  function runDefenseTen() {
    const results = Array.from({ length: 10 }, () => BaseballDefensePrototype.resolveDefensivePlay(defenseInput(defenseRolls())));
    renderDefense(results[results.length - 1]);
    $("defenseSummary").innerHTML = [
      summaryBlock("Decision Quality distribution", countBy(results, result => result.throwDecision && result.throwDecision.quality)),
      summaryBlock("Execution distribution", countBy(results, result => result.throwExecution && result.throwExecution.tier)),
      summaryBlock("Result distribution", countBy(results, result => result.result && result.result.resultType))
    ].join("");
    $("defenseTrace").textContent = JSON.stringify({ runs: results.map(result => ({ rolls: result.input.rolls, fielding: result.fielding.execution.tier, control: result.control.quality, throwDecision: result.throwDecision.quality || "unavailable", throwExecution: result.throwExecution && result.throwExecution.tier, result: result.result.resultType })) }, null, 2);
  }

  function selectButtons(selector, attribute, onSelect) {
    document.querySelectorAll(selector).forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(selector).forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        onSelect(button.getAttribute(attribute));
      });
    });
  }

  function updateDiveAvailability() {
    const button = document.querySelector('[data-fielding-approach="dive"]');
    const available = BaseballDefensePrototype.isDiveAvailable(value("defBallType"), value("defDifficulty"));
    button.disabled = !available;
    if (!available && fieldingApproach === "dive") {
      fieldingApproach = "secure";
      document.querySelectorAll("[data-fielding-approach]").forEach(item => item.classList.toggle("selected", item.getAttribute("data-fielding-approach") === "secure"));
    }
    pendingFielding = null;
    clearThrowOutcome();
    setThrowStage(false);
  }

  function resetPage() {
    resetRandom();
    pendingFielding = null;
    $("offenseResult").innerHTML = "";
    $("offenseSummary").innerHTML = "";
    $("offenseTrace").textContent = "尚未執行";
    $("fieldingResult").innerHTML = "";
    $("defenseResult").innerHTML = "";
    $("defenseSummary").innerHTML = "";
    $("defenseTrace").textContent = "尚未執行";
    setThrowStage(false);
    updateDiveAvailability();
  }

  document.querySelectorAll(".tab-button").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(item => item.classList.toggle("selected", item === button));
    document.querySelectorAll(".prototype-panel").forEach(panel => panel.classList.toggle("active", panel.id === button.dataset.tab));
  }));
  selectButtons("[data-offense-approach]", "data-offense-approach", selected => { offenseApproach = selected; });
  selectButtons("[data-fielding-approach]", "data-fielding-approach", selected => { fieldingApproach = selected; pendingFielding = null; clearThrowOutcome(); setThrowStage(false); });
  selectButtons("[data-throw-decision]", "data-throw-decision", selected => { throwDecision = selected; });
  ["defBallType", "defDifficulty"].forEach(id => $(id).addEventListener("change", updateDiveAvailability));
  ["defBatter", "defFielding", "defBody"].forEach(id => $(id).addEventListener("change", () => { pendingFielding = null; clearThrowOutcome(); setThrowStage(false); }));
  $("runOffenseOnce").addEventListener("click", runOffenseOnce);
  $("runOffenseTen").addEventListener("click", runOffenseTen);
  $("runFielding").addEventListener("click", runFielding);
  $("runDefenseOnce").addEventListener("click", runDefenseOnce);
  $("runDefenseTen").addEventListener("click", runDefenseTen);
  $("resetPrototype").addEventListener("click", resetPage);
  resetPage();
})();
