// A deterministic-ish stand-in for the real Claude narrator.
//
// It speaks the same protocol the real model would: respond() returns either
//   { command: "ROLL_DICE" }                          -> caller rolls, calls again
//   { text, score, stateUpdates }                     -> a narration turn
// The router applies stateUpdates and feeds the roll back via `lastRoll`.
// Replacing this file with a real Anthropic call (using MINDY_SYSTEM_PROMPT)
// is all that's needed to make the game "real".

const { CLASSES } = require("./game-state");
const { describeRoll } = require("./dice");

const RISKY = [
  "attack", "punch", "hit", "strike", "fight", "kill", "steal", "sneak",
  "climb", "jump", "leap", "search", "look for", "persuade", "convince",
  "deal", "bargain", "haggle", "charge", "cast", "smite", "bribe", "lie",
];

const PASSIVE = ["wait", "do nothing", "nothing", "stand", "watch", "hesitate"];

function findClass(msg) {
  const low = msg.toLowerCase();
  return CLASSES.find((c) => low.includes(c.toLowerCase())) || null;
}

function isQuestion(msg) {
  const t = msg.trim();
  return t.endsWith("?") || /^(what|who|where|why|how|when|can i|is there|do )/i.test(t);
}

function isRisky(msg) {
  const low = msg.toLowerCase();
  return RISKY.some((w) => low.includes(w));
}

function scoreAction(state, msg) {
  const low = msg.toLowerCase();
  if (PASSIVE.some((w) => low.includes(w))) return 2; // passivity is punished
  // Cleric is a support/faith class: reckless raw aggression is off-character.
  if (state.className === "Cleric" && /(punch|charge|brawl|rage)/.test(low)) return 2;
  if (state.flaw && low.includes(state.flaw.toLowerCase().split(" ")[0])) return 5;
  if (low.includes("pray") || low.includes("heal") || low.includes("bless")) {
    return state.className === "Cleric" ? 5 : 4;
  }
  return 4;
}

function respond({ state, message, lastRoll }) {
  const msg = (message || "").trim();

  // --- Phase 1: choose a class ---------------------------------------------
  if (state.phase === "class") {
    const picked = findClass(msg);
    if (!picked) {
      return {
        text:
          "Choose your class to begin. Available: " +
          CLASSES.join(", ") +
          ". Which calling is yours?",
        score: null,
        stateUpdates: {},
      };
    }
    return {
      text:
        `A ${picked}. Good. Now tell me your name, one personality strength, ` +
        `and one personality flaw. A strong flaw helps you fit in — don't be shy with it.`,
      score: null,
      stateUpdates: { className: picked, phase: "identity" },
    };
  }

  // --- Phase 2: name + strength + flaw -> guild intro -----------------------
  if (state.phase === "identity") {
    const name = (msg.split(/[,\.]/)[0] || "Traveler").trim() || "Traveler";
    return {
      text:
        `${name} the ${state.className}: steady where others break, ` +
        `but quick to leap before looking. The guild hall hums around you. ` +
        `A clerk glances up: "Oh, I didn't see you enter. Are you here to ` +
        `register as an E-rank?"`,
      score: null,
      stateUpdates: { name, phase: "guild" },
    };
  }

  // --- Phase 3: guild registration -----------------------------------------
  if (state.phase === "guild") {
    return {
      text:
        `The clerk stamps a worn copper tag and slides it over. "Welcome, ` +
        `E-rank ${state.name}. Rank up to S and the realm is yours." ` +
        `A notice board creaks with jobs nearby. What do you do?`,
      score: 4,
      stateUpdates: { phase: "playing", rank: "E" },
    };
  }

  // --- Phase 4: free play ---------------------------------------------------
  // Questions don't advance the story and don't affect the score.
  if (isQuestion(msg)) {
    return {
      text:
        "Lumaria thrives on wine and wool, its streets split by the Ronada " +
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

  const score = scoreAction(state, msg);
  let text;
  if (lastRoll != null) {
    const band = describeRoll(lastRoll);
    const hostile = score <= 3;
    text =
      `The dice land on ${lastRoll} — a ${band}. ` +
      (hostile
        ? "And the world has noticed you slipping out of character; it leans " +
          "against you, colder and sharper than before."
        : "You stay true to yourself, and fortune bends a little your way.") +
      " What do you do next?";
  } else {
    text =
      score <= 3
        ? "That is not like you, and the world tightens around you — eyes " +
          "narrow, doors close, the air turns unkind. What do you do?"
        : "You act in keeping with who you are. The moment holds steady. " +
          "What do you do next?";
  }

  return { text, score, stateUpdates: {} };
}

module.exports = { respond, isRisky, isQuestion, scoreAction, findClass };
