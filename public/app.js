const log = document.getElementById("log");
const form = document.getElementById("form");
const input = document.getElementById("input");
const sendBtn = form.querySelector("button");

let sessionId = localStorage.getItem("mindy.session") || null;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function addPlayer(text) {
  log.appendChild(el("div", "msg player", text));
  scroll();
}

function addSystem(text) {
  log.appendChild(el("div", "msg system", text));
  scroll();
}

function addMindy(reply) {
  const wrap = el("div", "msg mindy");
  if (reply.dice != null || typeof reply.score === "number") {
    const meta = el("div", "meta");
    if (reply.dice != null) meta.appendChild(el("span", "badge dice", "🎲 " + reply.dice));
    if (typeof reply.score === "number") {
      const b = el("span", "badge score" + (reply.score <= 3 ? " low" : ""), "In Character " + reply.score + "/5");
      meta.appendChild(b);
    }
    wrap.appendChild(meta);
  }
  wrap.appendChild(el("div", null, reply.text));
  log.appendChild(wrap);
  scroll();
}

function scroll() { log.scrollTop = log.scrollHeight; }

function renderState(state) {
  if (!state) return;
  document.getElementById("s-name").textContent = state.name || "—";
  document.getElementById("s-class").textContent = state.className || "—";
  document.getElementById("s-rank").textContent = state.rank || "—";
  document.getElementById("s-balance").textContent = state.balance + " silver";
  document.getElementById("s-location").textContent = state.location || "—";
  document.getElementById("s-score").textContent =
    state.lastScore == null ? "—" : state.lastScore + "/5";
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function start() {
  log.innerHTML = "";
  const data = await post("/game/start", { sessionId });
  sessionId = data.sessionId;
  localStorage.setItem("mindy.session", sessionId);
  addMindy(data.reply);
  renderState(data.state);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addPlayer(text);
  sendBtn.disabled = true;
  try {
    const data = await post("/game/message", { sessionId, message: text });
    if (data.error) { addSystem("Error: " + data.error); return; }
    addMindy(data.reply);
    renderState(data.state);
  } catch (err) {
    addSystem("The connection to the realm faltered. Try again.");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

document.getElementById("reset").addEventListener("click", () => {
  sessionId = null;
  localStorage.removeItem("mindy.session");
  start();
});

start();
