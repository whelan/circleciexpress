// Server-side dice so the roll can never be manipulated by the client.

// Roll a d100: an integer from 1 to 100 (higher is a better outcome).
function rollD100() {
  return Math.floor(Math.random() * 100) + 1;
}

// Describe a d100 result in broad bands, used by the mock narrator and handy
// for the real model too.
function describeRoll(n) {
  if (n <= 10) return "critical failure";
  if (n <= 35) return "failure";
  if (n <= 65) return "mixed";
  if (n <= 90) return "success";
  return "critical success";
}

module.exports = { rollD100, describeRoll };
