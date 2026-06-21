// Per-session game state for the server. The shape of a fresh state comes from
// the shared engine; this module only adds in-memory session storage.
const core = require("./docs/mindy-core");

const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) sessions.set(id, core.newState());
  return sessions.get(id);
}

function resetSession(id) {
  sessions.set(id, core.newState());
  return sessions.get(id);
}

module.exports = {
  CLASSES: core.CLASSES,
  newState: core.newState,
  getSession,
  resetSession,
  sessions,
};
