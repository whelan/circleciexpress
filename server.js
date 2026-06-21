var express = require('express');
var path = require('path');
var exampleRouter = require("./example-router");
var gameRouter = require("./game-router");
var app = express();

// Mindy dungeon-master game.
// Root serves the static, browser-only build (same files GitHub Pages serves
// from /docs). The /game API + the server-backed UI under /server remain for
// anyone who wants server-authoritative play.
app.use("/game", gameRouter);
app.use(express.static(path.join(__dirname, "docs")));
app.use("/server", express.static(path.join(__dirname, "public")));

app.use("/example", exampleRouter);

app.get('/hello', function (req, res) {
    res.send('Hello Worlds!');
});

if (require.main === module) {
    app.listen(8080);
    console.log("Running on port 8080");
}

module.exports = app;
