// Client-side glue. All game logic comes from MindyCore (mindy-core.js), so this
// runs with no backend — exactly what GitHub Pages needs.
(function () {
  var core = window.MindyCore;
  var log = document.getElementById("log");
  var form = document.getElementById("form");
  var input = document.getElementById("input");
  var sendBtn = form.querySelector("button");

  var SAVE_KEY = "mindy.state";
  var state = load() || core.newState();

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  function addPlayer(text) { log.appendChild(el("div", "msg player", text)); scroll(); }

  function addMindy(reply) {
    var wrap = el("div", "msg mindy");
    if (reply.dice != null || typeof reply.score === "number") {
      var meta = el("div", "meta");
      if (reply.dice != null) meta.appendChild(el("span", "badge dice", "🎲 " + reply.dice));
      if (typeof reply.score === "number") {
        meta.appendChild(el("span", "badge score" + (reply.score <= 3 ? " low" : ""),
          "In Character " + reply.score + "/5"));
      }
      wrap.appendChild(meta);
    }
    wrap.appendChild(el("div", null, reply.text));
    log.appendChild(wrap);
    scroll();
  }

  function renderState() {
    document.getElementById("s-name").textContent = state.name || "—";
    document.getElementById("s-class").textContent = state.className || "—";
    document.getElementById("s-rank").textContent = state.rank || "—";
    document.getElementById("s-balance").textContent = state.balance + " silver";
    document.getElementById("s-location").textContent = state.location || "—";
    document.getElementById("s-score").textContent =
      state.lastScore == null ? "—" : state.lastScore + "/5";
  }

  function opening() {
    // Mindy's first line: prompt for a class.
    return core.runTurn(state, "");
  }

  function start() {
    log.innerHTML = "";
    state = core.newState();
    addMindy(opening());
    renderState();
    save();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addPlayer(text);
    var reply = core.runTurn(state, text);
    addMindy(reply);
    renderState();
    save();
    input.focus();
  });

  document.getElementById("reset").addEventListener("click", start);

  // Resume a saved game, or begin a fresh one.
  if (state.phase === "class" && state.name == null) {
    start();
  } else {
    addMindy({ text: "Welcome back, " + (state.name || "traveler") + ". The realm waited. What do you do?", score: null, dice: null });
    renderState();
  }
})();
