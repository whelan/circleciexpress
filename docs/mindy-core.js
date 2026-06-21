// Mindy game engine — the single source of truth for game logic.
//
// This file is a UMD module: it runs unchanged in the browser (as the global
// `MindyCore`, loaded via <script>) AND in Node (via require). GitHub Pages
// serves this file from /docs, so the static site needs no backend at all.
// The Express server (dice.js, game-state.js, mock-mindy.js, game-router.js)
// also requires this same file, so the two never drift apart.
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MindyCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CLASSES = [
    "Cleric", "Ranger", "Warrior", "Mage", "Rogue", "Bard", "Paladin",
  ];

  // --- Dice (server-authoritative when run on the server) -------------------
  function rollD100() {
    return Math.floor(Math.random() * 100) + 1;
  }

  function describeRoll(n) {
    if (n <= 10) return "critical failure";
    if (n <= 35) return "failure";
    if (n <= 65) return "mixed";
    if (n <= 90) return "success";
    return "critical success";
  }

  // --- State ----------------------------------------------------------------
  function newState() {
    return {
      phase: "class", // class -> identity -> guild -> playing
      name: null,
      className: null,
      strength: null,
      flaw: null,
      rank: "E",
      balance: 0,
      inventory: [],
      companions: [],
      location: "Adventurer's Guild, Lumaria",
      quests: [],
      lastScore: null,
    };
  }

  // --- Narrator (mock stand-in for the real Claude model) -------------------
  var RISKY = [
    "attack", "punch", "hit", "strike", "fight", "kill", "steal", "sneak",
    "climb", "jump", "leap", "search", "look for", "persuade", "convince",
    "deal", "bargain", "haggle", "charge", "cast", "smite", "bribe", "lie",
  ];

  var PASSIVE = ["wait", "do nothing", "nothing", "stand", "watch", "hesitate"];

  function findClass(msg) {
    var low = msg.toLowerCase();
    for (var i = 0; i < CLASSES.length; i++) {
      if (low.indexOf(CLASSES[i].toLowerCase()) !== -1) return CLASSES[i];
    }
    return null;
  }

  function isQuestion(msg) {
    var t = msg.trim();
    return t.endsWith("?") || /^(what|who|where|why|how|when|can i|is there|do )/i.test(t);
  }

  function isRisky(msg) {
    var low = msg.toLowerCase();
    return RISKY.some(function (w) { return low.indexOf(w) !== -1; });
  }

  function scoreAction(state, msg) {
    var low = msg.toLowerCase();
    if (PASSIVE.some(function (w) { return low.indexOf(w) !== -1; })) return 2;
    // Cleric is a support/faith class: reckless raw aggression is off-character.
    if (state.className === "Cleric" && /(punch|charge|brawl|rage)/.test(low)) return 2;
    if (state.flaw && low.indexOf(state.flaw.toLowerCase().split(" ")[0]) !== -1) return 5;
    if (low.indexOf("pray") !== -1 || low.indexOf("heal") !== -1 || low.indexOf("bless") !== -1) {
      return state.className === "Cleric" ? 5 : 4;
    }
    return 4;
  }

  // respond() returns either { command: "ROLL_DICE" } or
  // { text, score, stateUpdates }, exactly the protocol the real model uses.
  function respond(args) {
    var state = args.state;
    var lastRoll = args.lastRoll;
    var msg = (args.message || "").trim();

    if (state.phase === "class") {
      var picked = findClass(msg);
      if (!picked) {
        return {
          text: "Choose your class to begin. Available: " + CLASSES.join(", ") +
            ". Which calling is yours?",
          score: null,
          stateUpdates: {},
        };
      }
      return {
        text: "A " + picked + ". Good. Now tell me your name, one personality " +
          "strength, and one personality flaw. A strong flaw helps you fit in — " +
          "don't be shy with it.",
        score: null,
        stateUpdates: { className: picked, phase: "identity" },
      };
    }

    if (state.phase === "identity") {
      var name = (msg.split(/[,\.]/)[0] || "Traveler").trim() || "Traveler";
      return {
        text: name + " the " + state.className + ": steady where others break, " +
          "but quick to leap before looking. The guild hall hums around you. " +
          "A clerk glances up: \"Oh, I didn't see you enter. Are you here to " +
          "register as an E-rank?\"",
        score: null,
        stateUpdates: { name: name, phase: "guild" },
      };
    }

    if (state.phase === "guild") {
      return {
        text: "The clerk stamps a worn copper tag and slides it over. \"Welcome, " +
          "E-rank " + state.name + ". Rank up to S and the realm is yours.\" " +
          "A notice board creaks with jobs nearby. What do you do?",
        score: 4,
        stateUpdates: { phase: "playing", rank: "E" },
      };
    }

    // Questions don't advance the story and don't affect the score.
    if (isQuestion(msg)) {
      return {
        text: "Lumaria thrives on wine and wool, its streets split by the Ronada " +
          "river. Beyond the walls lie open fields, the Finarus forest, and the " +
          "far Minara mountains. Ask freely — none of this counts against you.",
        score: null,
        stateUpdates: {},
      };
    }

    // Risky actions require a roll first.
    if (isRisky(msg) && lastRoll == null) {
      return { command: "ROLL_DICE" };
    }

    var score = scoreAction(state, msg);
    var text;
    if (lastRoll != null) {
      var band = describeRoll(lastRoll);
      text = "The dice land on " + lastRoll + " — a " + band + ". " +
        (score <= 3
          ? "And the world has noticed you slipping out of character; it leans " +
            "against you, colder and sharper than before."
          : "You stay true to yourself, and fortune bends a little your way.") +
        " What do you do next?";
    } else {
      text = score <= 3
        ? "That is not like you, and the world tightens around you — eyes " +
          "narrow, doors close, the air turns unkind. What do you do?"
        : "You act in keeping with who you are. The moment holds steady. " +
          "What do you do next?";
    }

    return { text: text, score: score, stateUpdates: {} };
  }

  // One full player turn: resolve a ROLL_DICE request if the narrator asks for
  // one, apply state updates, and return { text, score, dice }. Mutates `state`.
  function runTurn(state, message) {
    var reply = respond({ state: state, message: message, lastRoll: null });
    var dice = null;

    if (reply && reply.command === "ROLL_DICE") {
      dice = rollD100();
      reply = respond({ state: state, message: message, lastRoll: dice });
    }

    var updates = reply.stateUpdates || {};
    for (var k in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) state[k] = updates[k];
    }
    if (typeof reply.score === "number") state.lastScore = reply.score;

    return { text: reply.text, score: reply.score == null ? null : reply.score, dice: dice };
  }

  return {
    CLASSES: CLASSES,
    rollD100: rollD100,
    describeRoll: describeRoll,
    newState: newState,
    findClass: findClass,
    isQuestion: isQuestion,
    isRisky: isRisky,
    scoreAction: scoreAction,
    respond: respond,
    runTurn: runTurn,
  };
});
