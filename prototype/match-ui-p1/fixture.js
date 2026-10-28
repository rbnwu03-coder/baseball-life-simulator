/* Fixed DTO copies only. Source: docs/match-ui-slice-data-contract-v0.1-evidence.json
 * Source SHA-256: a0a92044a9776905a4cc602f8948e3fcaa91e748d7fa395ab5d3be5be115f163
 * No simulation, network load, or generated alternative-route results. */
(function (root, factory) {
  "use strict";
  const fixture = factory();
  if (typeof module === "object" && module.exports) module.exports = fixture;
  else Object.defineProperty(root, "MATCH_UI_P1_FIXTURE", { value: fixture, writable: false });
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function freeze(value) {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  return freeze({
  "decision": {
    "schemaVersion": "match-ui-slice/0.1",
    "presentationId": "example-ss-6-3-20261016",
    "matchId": "hs-y1-autumn-exhibition",
    "momentId": "hs_y1_match_moment_2",
    "inning": 4,
    "half": "top",
    "presentationSequence": 0,
    "kind": "decision",
    "player": {
      "id": "player",
      "position": "SS"
    },
    "state": {
      "outs": 1,
      "scores": {
        "home": 0,
        "away": 1
      },
      "bases": [
        true,
        false,
        false
      ]
    },
    "situationText": "1 出局，一壘有人。進入游擊守區的滾地球往你的左側移動；依正式守位與來球方向確認處理責任，再比較跑者及傳球時間。。一壘跑者受迫往二壘，打者跑者正衝向一壘。這是一般擊球形成的滾地守備：二壘封殺窗口很緊，打者的一壘出局窗口很緊。",
    "observations": {
      "directionText": null,
      "paceText": null,
      "runnerCue": null,
      "readCue": null
    },
    "choices": [
      {
        "routeId": "secureFirstBaseOut",
        "matchDecision": "secure",
        "matchMomentId": "hs_y1_match_moment_2",
        "label": "先處理一壘的打者跑者",
        "objectiveText": "優先爭取打者出局",
        "risk": "low",
        "routeLabel": "6-3"
      },
      {
        "routeId": "forceSecond",
        "matchDecision": "forceSecond",
        "matchMomentId": "hs_y1_match_moment_2",
        "label": "傳二壘封殺一壘跑者，先完成一個出局",
        "objectiveText": "優先處理前位跑者",
        "risk": "medium",
        "routeLabel": "6-4"
      },
      {
        "routeId": "startDoublePlaySecond",
        "matchDecision": "challenge",
        "matchMomentId": "hs_y1_match_moment_2",
        "label": "轉傳二壘，再由二壘手轉一壘挑戰雙殺",
        "objectiveText": "嘗試完成雙殺",
        "risk": "high",
        "routeLabel": "6-4-3"
      },
      {
        "routeId": "holdBall",
        "matchDecision": "contain",
        "matchMomentId": "hs_y1_match_moment_2",
        "label": "先控制球與最前方跑者，不勉強擴大失誤",
        "objectiveText": "控制球與跑者",
        "risk": "low",
        "routeLabel": "持球"
      }
    ]
  },
  "playback": [
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 1,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:1",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [],
      "type": "ballInPlay",
      "payload": {
        "ballType": "groundBall",
        "direction": "leftSide",
        "pace": "firm",
        "depth": null
      }
    },
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 2,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:2",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [
        "example-ss-6-3-20261016:beat:1"
      ],
      "type": "approach",
      "payload": {
        "actorId": "player",
        "status": "completed"
      }
    },
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 3,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:3",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [
        "example-ss-6-3-20261016:beat:2"
      ],
      "type": "control",
      "payload": {
        "actorId": "player",
        "status": "completed"
      }
    },
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 4,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:4",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [
        "example-ss-6-3-20261016:beat:3"
      ],
      "type": "throw",
      "payload": {
        "actorId": "player",
        "receiverId": "school-development-29d536a2-player-03",
        "targetBase": "first",
        "status": "completed"
      }
    },
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 5,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:5",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [
        "example-ss-6-3-20261016:beat:4"
      ],
      "type": "receive",
      "payload": {
        "actorId": "school-development-29d536a2-player-03",
        "targetBase": "first",
        "status": "completed"
      }
    },
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 6,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:6",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [
        "example-ss-6-3-20261016:beat:5"
      ],
      "type": "contest",
      "payload": {
        "runnerId": "regional-power-school-player-09",
        "targetBase": "first",
        "comparison": "defenseClearlyAhead"
      }
    },
    {
      "schemaVersion": "match-ui-slice/0.1",
      "presentationId": "example-ss-6-3-20261016",
      "matchId": "hs-y1-autumn-exhibition",
      "momentId": "hs_y1_match_moment_2",
      "inning": 4,
      "half": "top",
      "presentationSequence": 7,
      "kind": "playback",
      "eventId": "example-ss-6-3-20261016:beat:7",
      "actualRouteId": "secureFirstBaseOut",
      "dependsOn": [
        "example-ss-6-3-20261016:beat:6"
      ],
      "type": "result",
      "payload": {
        "resultCode": "oneOut",
        "outsCreated": 1,
        "error": false
      }
    }
  ],
  "resolution": {
    "schemaVersion": "match-ui-slice/0.1",
    "presentationId": "example-ss-6-3-20261016",
    "matchId": "hs-y1-autumn-exhibition",
    "momentId": "hs_y1_match_moment_2",
    "inning": 4,
    "half": "top",
    "presentationSequence": 8,
    "kind": "resolution",
    "status": "settled",
    "selectedRouteId": "secureFirstBaseOut",
    "actualRouteId": "secureFirstBaseOut",
    "resultCode": "oneOut",
    "batterResult": "out",
    "state": {
      "outs": 2,
      "scores": {
        "home": 0,
        "away": 1
      },
      "bases": [
        false,
        true,
        false
      ]
    },
    "runnerChanges": [
      {
        "runnerId": "regional-power-school-player-09",
        "from": "batter",
        "to": "out"
      },
      {
        "runnerId": "regional-power-school-player-04",
        "from": 1,
        "to": 2
      }
    ],
    "outcomeText": "你把球傳向一壘，球趕在打者跑者之前到達，一壘完成打者出局。 一壘跑者從一壘推進到二壘。 現在 2 出局、二壘有人。",
    "feedbackText": "主要原因：各段守備都在有效窗口內完成。"
  }
});
});
