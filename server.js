var express = require('express');
var path = require('path');
var exampleRouter = require("./example-router");
var gameRouter = require("./game-router");
var app = express();

// Mindy dungeon-master game: API + static UI.
app.use("/game", gameRouter);
app.use(express.static(path.join(__dirname, "public")));

app.use("/example", exampleRouter);

app.get('/hello', function (req, res) {
    res.send('Hello Worlds!');
});

if (require.main === module) {
    app.listen(8080);
    console.log("Running on port 8080");
}

module.exports = app;
