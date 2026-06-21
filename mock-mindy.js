// Stand-in narrator. The actual implementation lives in the shared engine
// (docs/mindy-core.js) so the browser build and the server use identical logic.
// To go live with real Claude, swap core.respond for an Anthropic call using
// MINDY_SYSTEM_PROMPT and keep the same { command:"ROLL_DICE" } / { text, score,
// stateUpdates } protocol.
const core = require("./docs/mindy-core");

module.exports = {
  respond: core.respond,
  isRisky: core.isRisky,
  isQuestion: core.isQuestion,
  scoreAction: core.scoreAction,
  findClass: core.findClass,
};
