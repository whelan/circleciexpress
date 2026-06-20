// HTTP surface for the Mindy game. Pure orchestration: it owns the ROLL_DICE
// loop and state mutation, and stays agnostic about whether the narrator is the
// mock or the real Claude model.

const express = require("express");
const crypto = require("crypto");

const mindy = require("./mock-mindy");
const { rollD100 } = require("./dice");
const { getSession, resetSession } = require("./game-state");

const router = express.Router();
router.use(express.json());

// Run one player turn through the narrator, resolving a dice roll if the
// narrator asks for one. Returns { text, score, dice }.
function runTurn(state, message) {
  let reply = mindy.respond({ state, message, lastRoll: null });
  let dice = null;

  if (reply && reply.command === "ROLL_DICE") {
    dice = rollD100();
    reply = mindy.respond({ state, message, lastRoll: dice });
  }

  Object.assign(state, reply.stateUpdates || {});
  if (typeof reply.score === "number") state.lastScore = reply.score;

  return { text: reply.text, score: reply.score == null ? null : reply.score, dice };
}

// Begin (or restart) a game and get Mindy's opening line.
router.post("/start", function (req, res) {
  const sessionId = (req.body && req.body.sessionId) || crypto.randomUUID();
  const state = resetSession(sessionId);
  const reply = runTurn(state, "");
  res.json({ sessionId, reply, state });
});

// Send a player message and get the next narration.
router.post("/message", function (req, res) {
  const body = req.body || {};
  if (!body.sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  if (typeof body.message !== "string" || !body.message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }
  const state = getSession(body.sessionId);
  const reply = runTurn(state, body.message);
  res.json({ sessionId: body.sessionId, reply, state });
});

// Inspect current state (handy for the UI sidebar and for tests).
router.get("/state", function (req, res) {
  if (!req.query.sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  res.json({ sessionId: req.query.sessionId, state: getSession(req.query.sessionId) });
});

module.exports = router;
module.exports.runTurn = runTurn;
