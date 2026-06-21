// Server-side dice. Logic lives in the shared engine so the browser build and
// the Node server stay in sync.
const core = require("./docs/mindy-core");

module.exports = { rollD100: core.rollD100, describeRoll: core.describeRoll };
