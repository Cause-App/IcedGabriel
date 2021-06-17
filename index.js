`use strict`

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const { games } = require("./games");
require("dotenv").config();

const port = process.env.PORT || 8000;
const { db } = require("./common");

const forceHTTPS = (req, res, next) => {
    if (req.protocol === "https" || req.headers.host.split(":")[0] === "localhost") {
        next();
    } else {
        res.redirect("https://" + req.headers.host + req.url);
    }
}

app.enable('trust proxy');
// app.use(forceHTTPS);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const router = express.Router();

for (const game of games) {
    router.use(`/api/${game.id}`, game.router);
}

if (fs.existsSync("./ZippedGameCode")) {
    fs.rmSync("./ZippedGameCode", { recursive: true, force: true });
}

fs.mkdirSync("./ZippedGameCode");
fs.mkdirSync("./ZippedGameCode/Game");
fs.mkdirSync("./ZippedGameCode/Player");

for (const game of games) {
    for (const [baseDir, outDir, suffix] of [["./GameCode", "Game", ""], ["./DefaultPlayers", "Player", "-template-player"]]) {
        const p = path.join("./ZippedGameCode", outDir, game.id + suffix + ".zip");
        const output = fs.createWriteStream(p);
        const archive = archiver("zip");

        output.on("close", function () {
            console.log(`Finished archiving ${p}`);
        });

        archive.on("error", (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(path.join(baseDir, game.id), false);

        archive.finalize();
    }
}

app.use(router);

app.use((req, res, next) => {
    req.method = "GET";
    next();
});

const _app_folder = './frontend/dist/frontend';

app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));
app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, { root: _app_folder });
});

if (fs.existsSync("./RunningGames")) {
    fs.rmSync("./RunningGames", { recursive: true, force: true });
}

fs.mkdirSync("./RunningGames");

db.client.connect(function (err) {
    if (err) {
        console.error(err);
        return;
    }

    db.db = db.client.db("icedgabriel");

    http.listen(port, () => {
        console.log(`Listening on port ${port}`)
    });

    io.on("connection", (socket) => {
        for (const game of games) {
            game.socketHandlers(socket);
        }
    });
});
