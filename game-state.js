// Per-session game state. Kept in memory; swap for a real store if you need
// persistence across restarts.

const CLASSES = [
  "Cleric", "Ranger", "Warrior", "Mage", "Rogue", "Bard", "Paladin",
];

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

const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) sessions.set(id, newState());
  return sessions.get(id);
}

function resetSession(id) {
  sessions.set(id, newState());
  return sessions.get(id);
}

module.exports = { CLASSES, newState, getSession, resetSession, sessions };
