const express = require("express");
const { db, requireLogin, validateToken } = require("../../common");
const fs = require("fs");
const fse = require("fs-extra");
const { exec } = require('child_process');
const path = require("path");
const mongo = require('mongodb')
const validFilename = require('valid-filename');

const initialHeapSize = 1024 * 1024 * 2;
// The default size is 2097152 (2MB). 
// The value must be a multiple of, and greater than, 1024 bytes (1KB).

const maxHeapSize = 1024 * 1024 * 64;
// The default size is 67108864 (64MB). 
// The value must be a multiple of, and greater than, 1024 bytes (1KB).

const threadStackSize = 1024 * 512;
const snakeCodePath = "./GameCode/Snake";
const runningGamesPath = "./RunningGames";

const MAX_GAMES = 5;

const GRID_WIDTH = 16;
const GRID_HEIGHT = 16;
const SNAKE_MOVE_MAX_MILLIS = 200;
const MAX_ROUNDS = 1000;

const router = express.Router();

const filenameValid = (filename) => {
    return validFilename(filename);
}

const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject({ err, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

router.get("/getsnakes", requireLogin, (req, res) => {
    const snakeCollection = db.db.collection("snake");

    snakeCollection.find({ owner: req.userid }).toArray((err, docs) => {
        if (err) {
            console.err(err);
            res.json([]);
            return;
        }
        res.json(docs);
    });
});

router.get("/getallsnakes", requireLogin, (req, res) => {
    const snakeCollection = db.db.collection("snake");

    snakeCollection.find().toArray((err, docs) => {
        if (err) {
            console.err(err);
            res.json([]);
            return;
        }
        res.json(docs);
    });
});

router.post("/editsnake", requireLogin, (req, res) => {
    const snakeCollection = db.db.collection("snake");

    const id = req.body.id && req.body.id !== "undefined" ? req.body.id : undefined;

    const name = req.body.name || "An unnamed snake";

    if (name.length > 32) {
        res.json({ err: "Failed to update snake. Snake name too long" });
        return;
    }

    if (id && id.length > 32) {
        res.json({ err: "Failed to update snake. Snake id too long" });
        return;
    }

    if (!req.body.code) {
        res.json({ err: "Failed to update snake. Code files were not uploaded properly" });
        return;
    }

    if (JSON.stringify(req.body.code).length > 1024 * 1024) {
        res.json({ err: "Failed to update snake. Code files too big" });
    }

    if (!Array.isArray(req.body.code)) {
        res.json({ err: "Failed to update snake. Code files were not uploaded properly" });
        return;
    }

    if (req.body.code.length > 16) {
        res.json({ err: "Failed to update snake. Too many code files" });
    }

    const sanitizedFiles = [];
    for (const file of req.body.code) {
        const { filename, code, protected } = file;
        if (!filename) {
            res.json({ err: "Failed to update snake. Code file malformed" });
            return;
        }
        if (!filenameValid(filename)) {
            res.json({ err: "Failed to update snake. File name invalid" });
            return;
        }
        sanitizedFiles.push({ filename, code: code || "", protected });
    }

    if (id) {
        snakeCollection.updateOne(
            {
                owner: req.userid,
                _id: mongo.ObjectId(id)
            },
            {
                $set: {
                    name: name,
                    code: sanitizedFiles
                }
            },
            (err) => {
                if (err) {
                    console.err(err);
                    res.json({ err });
                    return;
                }
                res.json({});
            }
        )
    } else {
        const toInsert = {
            owner: req.userid,
            ownerName: req.name,
            name: name,
            code: sanitizedFiles
        };
        snakeCollection.insertOne(
            toInsert,
            (err) => {
                if (err) {
                    console.err(err);
                    res.json({ err });
                    return;
                }
                res.json({ id: toInsert._id });
            }
        )
    }
});

router.get("/deletesnake", requireLogin, (req, res) => {
    const snakeCollection = db.db.collection("snake");

    const id = req.query.id && req.query.id !== "undefined" ? req.query.id : undefined;

    if (!id) {
        res.json({ err: "No snake ID specified" });
        return;
    }

    try {
        snakeCollection.deleteOne(
            {
                owner: req.userid,
                _id: mongo.ObjectId(id)
            },
        )
        res.json({});
    } catch (e) {
        res.json({ err: e });
    }
});

const playGame = async (s1ID, s2ID, requireS1Owner, callback) => {
    const snakeCollection = db.db.collection("snake");

    const s1Query = { _id: mongo.ObjectId(s1ID) };
    if (requireS1Owner) {
        s1Query.owner = requireS1Owner.sub;
    }

    const mySnake = await snakeCollection.findOne(s1Query);
    if (!mySnake) {
        callback({ err: "Your snake does not exist or you do not own it" });
    }

    const opponentSnake = await snakeCollection.findOne({ _id: mongo.ObjectId(s2ID) });
    if (!opponentSnake) {
        callback({ err: "Your opponent's snake does not exist" });
    }

    let gamePath;
    try {
        const existing = fs.readdirSync(runningGamesPath).length;
        if (existing >= MAX_GAMES) {
            // TODO replace with a queue system
            callback({ err: "Too many games being played" });
        }

        gamePath = path.join(runningGamesPath, `Game${existing}`);
    } catch (err) {
        callback({ err: "Failed to read the running games directory" });
    }
    try {

        fse.copySync(snakeCodePath, gamePath);

        const mySnakePath = path.join(gamePath, "snake1");
        const opponentSnakePath = path.join(gamePath, "snake2");

        for (const [snakePath, snakeCode, package] of [[mySnakePath, mySnake.code, "snake1"], [opponentSnakePath, opponentSnake.code, "snake2"]]) {
            fs.mkdirSync(snakePath);

            for (const { filename, code } of snakeCode) {
                if (filenameValid(filename)) {
                    const toWrite = filename.endsWith(".java") ? `package ${package};\n${code}` : code;
                    fs.writeFileSync(path.join(snakePath, filename), toWrite);
                }
            }

        }

        await runCommand(`cd ${gamePath} && javac logic/Program.java`);

        const output = await runCommand(`unset JAVA_TOOL_OPTIONS && java -Djava.security.manager -Djava.security.policy==./snake.policy -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${gamePath} logic.Program ${GRID_WIDTH} ${GRID_HEIGHT} ${SNAKE_MOVE_MAX_MILLIS} ${MAX_ROUNDS}`);

        callback(output);

    } catch (err) {
        callback({ err });
    } finally {
        fs.rmSync(gamePath, { recursive: true, force: true });
    }

};

const socketHandlers = (socket) => {
    socket.on("snake/play", async (data, token) => {
        const userData = await validateToken(token);
        if (!userData) {
            socket.emit("snake/play", { err: "Access Denied" });
            return;
        }

        if (!data.myId || !data.opponentId) {
            socket.emit("snake/play", { err: "Snake IDs not provided" });
            return;
        }

        const { myId, opponentId } = data;

        playGame(myId, opponentId, userData, (response) => {
            socket.emit("snake/play", response);
        });

    })
};

module.exports = { snakeRouter: router, snakeSocketHandlers: socketHandlers };