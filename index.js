`use strict`

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
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
app.use(forceHTTPS);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const router = express.Router();

const {snakeRouter, snakeSocketHandlers} = require("./games/snake");
const {unoRouter, unoSocketHandlers} = require("./games/ein");
router.use("/api/snake", snakeRouter);
router.use("/api/ein", unoRouter);

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

if (fs.existsSync("./RunningGames")){
    fs.rmSync("./RunningGames", { recursive: true, force: true });
}

fs.mkdirSync("./RunningGames");

db.client.connect(function(err) {
    if (err) {
        console.err(err);
        return;
    }

    db.db = db.client.db("icedgabriel");

    http.listen(port, () => {
        console.log(`Listening on port ${port}`)
    });

    io.on("connection", (socket) => {
        snakeSocketHandlers(socket);
        unoSocketHandlers(socket);
    });
});
