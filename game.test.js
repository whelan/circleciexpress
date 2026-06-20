const assert = require("assert");

const { rollD100, describeRoll } = require("./dice");
const mindy = require("./mock-mindy");
const { runTurn } = require("./game-router");
const { newState } = require("./game-state");

describe("dice", () => {
  it("rollD100 always returns 1..100", () => {
    for (let i = 0; i < 1000; i++) {
      const n = rollD100();
      assert.ok(Number.isInteger(n) && n >= 1 && n <= 100, "out of range: " + n);
    }
  });

  it("describeRoll bands low and high results", () => {
    assert.strictEqual(describeRoll(1), "critical failure");
    assert.strictEqual(describeRoll(100), "critical success");
  });
});

describe("mock narrator phases", () => {
  it("asks for a class until one is chosen", () => {
    const s = newState();
    const r = mindy.respond({ state: s, message: "hello" });
    assert.ok(/choose your class/i.test(r.text));
  });

  it("advances to identity when a class is picked", () => {
    const s = newState();
    const r = mindy.respond({ state: s, message: "I am a Cleric" });
    assert.strictEqual(r.stateUpdates.className, "Cleric");
    assert.strictEqual(r.stateUpdates.phase, "identity");
  });

  it("requests a dice roll for risky actions", () => {
    const s = Object.assign(newState(), { phase: "playing", className: "Ranger" });
    const r = mindy.respond({ state: s, message: "I attack the bandit" });
    assert.strictEqual(r.command, "ROLL_DICE");
  });

  it("does not roll or score for questions", () => {
    const s = Object.assign(newState(), { phase: "playing" });
    const r = mindy.respond({ state: s, message: "What is Lumaria known for?" });
    assert.strictEqual(r.command, undefined);
    assert.strictEqual(r.score, null);
  });

  it("punishes passivity with a low in-character score", () => {
    const s = Object.assign(newState(), { phase: "playing", className: "Cleric" });
    const r = mindy.respond({ state: s, message: "I do nothing and wait" });
    assert.ok(r.score <= 3, "expected hostile score, got " + r.score);
  });
});

describe("runTurn orchestration", () => {
  it("resolves a ROLL_DICE turn into a narration with a dice value", () => {
    const s = Object.assign(newState(), { phase: "playing", className: "Rogue" });
    const out = runTurn(s, "I steal the purse");
    assert.ok(out.dice >= 1 && out.dice <= 100, "dice missing/out of range");
    assert.ok(typeof out.text === "string" && out.text.length > 0);
  });

  it("walks the full intro flow class -> identity -> guild -> playing", () => {
    const s = newState();
    runTurn(s, "Cleric");
    assert.strictEqual(s.phase, "identity");
    runTurn(s, "Whelan, calm in chaos, impulsive");
    assert.strictEqual(s.phase, "guild");
    assert.strictEqual(s.name, "Whelan");
    runTurn(s, "yes register me");
    assert.strictEqual(s.phase, "playing");
    assert.strictEqual(s.rank, "E");
  });
});
