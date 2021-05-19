const express = require("express");
const { db, requireLogin } = require("../../common");
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
                reject(err);
            } else {
                resolve({stdout, stderr});
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
})

router.get("/play", requireLogin, async (req, res) => {
    const snakeCollection = db.db.collection("snake");

    if (!req.query.myId || !req.query.opponentId) {
        res.json({ err: "Snake IDs not provided" });
        return;
    }

    const { myId, opponentId } = req.query;

    const mySnake = await snakeCollection.findOne({ owner: req.userid, _id: mongo.ObjectId(myId) });
    if (!mySnake) {
        res.json({ err: "Your snake does not exist or you do not own it" });
        return;
    }

    const opponentSnake = await snakeCollection.findOne({ _id: mongo.ObjectId(opponentId) });
    if (!opponentSnake) {
        res.json({ err: "Your opponent's snake does not exist" });
        return;
    }

    let gamePath;
    try {
        const existing = fs.readdirSync(runningGamesPath).length;
        if (existing >= MAX_GAMES) {
            // TODO replace with a queue system
            res.json( { err: "Too many games being played" } );
            return;
        }

        gamePath = path.join(runningGamesPath, `Game${existing}`);
    } catch (err) {
        res.json({err: "Failed to read the running games directory"});
        return;
    }
    try {

        fse.copySync(snakeCodePath, gamePath);

        const mySnakePath = path.join(gamePath, "snake1");
        const opponentSnakePath = path.join(gamePath, "snake2");

        for (const [snakePath, snakeCode, package] of [[mySnakePath, mySnake.code, "snake1"], [opponentSnakePath, opponentSnake.code, "snake2"]]) {
            fs.mkdirSync(snakePath);

            for (const { filename, code } of snakeCode) {
                if (filenameValid(filename)) {
                    fs.writeFileSync(path.join(snakePath, filename), `package ${package};\n${code}`);
                }
            }

        }

        await runCommand(`cd ${gamePath} && javac logic/Program.java`);

        const output = await runCommand(`unset JAVA_TOOL_OPTIONS && java -Djava.security.manager -Djava.security.policy==./snake.policy -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${gamePath} logic.Program ${GRID_WIDTH} ${GRID_HEIGHT} ${SNAKE_MOVE_MAX_MILLIS} ${MAX_ROUNDS}`);

        res.json(output);

    } catch (err) {
        res.json({ err });
    } finally {
        fs.rmSync(gamePath, { recursive: true, force: true });
    }

});

module.exports = router;