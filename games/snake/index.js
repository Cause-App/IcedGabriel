const express = require("express");
const { db, requireLogin, validateToken } = require("../../common");
const { enqueue, onDequeue, queue, removeFromQueue } = require("..");
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


const GRID_WIDTH = 16;
const GRID_HEIGHT = 16;
const SNAKE_MOVE_MAX_MILLIS = 50;
const MAX_ROUNDS = 500;
const NUMBER_OF_RANKED_GAMES = 32;

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

router.get("/leaderboard", async (req, res) => {
    const snakeLbCollection = db.db.collection("snakeleaderboard");
    const result = await snakeLbCollection.aggregate([
        { $sort: { 'rank': 1 } },
        { $group: { _id: '$owner', group: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: "$group" } }
    ]).project({code: false}).toArray();
    res.json(result);
});

router.get("/mine", requireLogin, (req, res) => {
    let snakeCollection = req.query.leaderboard ? db.db.collection("snakeleaderboard") : db.db.collection("snake");

    snakeCollection.find({ owner: req.userid }).toArray(async (err, docs) => {
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

    snakeCollection.find().project({ code: false }).toArray((err, docs) => {
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

const submitGame = async (s1ID, s2ID, requireS1Owner, collection, callback) => {
    const snakeCollection = db.db.collection("snake");
    const opponentSnakeCollection = collection ?? snakeCollection

    const s1Query = { _id: mongo.ObjectId(s1ID) };
    if (requireS1Owner) {
        s1Query.owner = requireS1Owner.sub;
    }

    const mySnake = await snakeCollection.findOne(s1Query);
    if (!mySnake) {
        callback({ err: "Your snake does not exist or you do not own it" });
        return;
    }

    const opponentSnake = await opponentSnakeCollection.findOne({ _id: mongo.ObjectId(s2ID) });
    if (!opponentSnake) {
        callback({ err: "Your opponent's snake does not exist" });
        return;
    }

    let peopleAheadOfMe = queue.length;

    const listener = () => {
        if (peopleAheadOfMe-- > 0) {
            callback({ queue: peopleAheadOfMe })
        }
    };

    const gameID = Date.now();

    callback({ gameID });

    callback({ queue: peopleAheadOfMe })

    onDequeue.on("dequeue", listener);


    enqueue(playGame, [mySnake, opponentSnake, callback, listener, !!collection], gameID);
};

const playGame = async (gamePath, mySnake, opponentSnake, callback, listener, ranked) => {
    try {
        onDequeue.removeListener("dequeue", listener);
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

        const output = await runCommand(`unset JAVA_TOOL_OPTIONS && java -Djava.security.manager -Djava.security.policy==./snake.policy -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${gamePath} logic.Program ${GRID_WIDTH} ${GRID_HEIGHT} ${SNAKE_MOVE_MAX_MILLIS} ${MAX_ROUNDS} ${ranked ? NUMBER_OF_RANKED_GAMES : -1}`);

        callback(output);

    } catch (err) {
        console.error(err);
        callback({ err });
    }
}

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
        let cancelled = false;
        submitGame(myId, opponentId, userData, null, (response) => {
            if (cancelled) {
                return;
            }
            if (response.gameID) {
                socket.once("snake/cancel", () => {
                    removeFromQueue(response.gameID);
                    cancelled = true;
                });
            } else {
                socket.emit("snake/play", response);
            }
        });

    });

    socket.on("snake/rank", async (data, token) => {
        const userData = await validateToken(token);
        if (!userData) {
            socket.emit("snake/rank", { err: "Access Denied" });
            return;
        }

        if (!data.myId) {
            socket.emit("snake/rank", { err: "Snake ID not provided" });
            return;
        }

        const { myId } = data;

        const snakeCollection = db.db.collection("snake");
        const snakeLbCollection = db.db.collection("snakeleaderboard");

        const mySnake = await snakeCollection.findOne({ _id: mongo.ObjectId(myId), owner: userData.sub });
        if (!mySnake) {
            socket.emit("snake/rank", { err: "Your snake does not exist or you do not own it" });
            return;
        }

        const snakeCount = (await snakeLbCollection.find({ _id: { $ne: mongo.ObjectId(myId) } }).count());

        const insertAt = async (n) => {
            const currentRank = (await snakeLbCollection.findOne({ _id: mongo.ObjectId(myId) }))?.rank;
            const session = db.client.startSession();

            try {
                await session.withTransaction(async () => {
                    if (currentRank !== undefined) {
                        await snakeLbCollection.deleteOne({ _id: mongo.ObjectId(myId) });
                        await snakeLbCollection.updateMany({ rank: { $gt: currentRank } }, { $inc: { rank: -1 } });
                    }
                    await snakeLbCollection.updateMany({ rank: { $gte: n } }, { $inc: { rank: 1 } });
                    await snakeLbCollection.insertOne({ _id: mongo.ObjectId(myId), owner: mySnake.owner, ownerName: mySnake.ownerName, code: mySnake.code, name: mySnake.name, rank: n });

                    socket.emit("snake/rank", { rank: n });
                });
            } catch (err) {
                console.error(err);
                socket.emit("snake/rank", { err });
            } finally {
                await session.endSession();
            }
        }

        let cancelled = false;
        let gameID = null;

        const doRound = (start, end) => {
            if (start > end) {
                insertAt(start);
                return
            }
            socket.emit("snake/rank", { start, end });
            const opponentIndex = Math.floor((start + end) / 2);
            snakeLbCollection.find({ _id: { $ne: mongo.ObjectId(myId) } }).sort({ rank: 1 }).skip(opponentIndex).limit(1).forEach((opponentSnake) => {
                submitGame(myId, opponentSnake._id, userData, snakeLbCollection, (response) => {
                    if (cancelled) {
                        return;
                    }
                    if (!response.stdout) {
                        if (response.gameID) {
                            gameID = response.gameID;
                        } else {
                            socket.emit("snake/rank", response);
                        }
                        return;
                    }
                    const [wins, losses, draws] = response.stdout.split(",").map(x => +x);
                    if (wins > losses) {
                        doRound(start, opponentIndex - 1);
                    } else if (wins < losses) {
                        doRound(opponentIndex + 1, end);
                    } else {
                        insertAt(opponentIndex);
                    }
                });
            });
        }

        doRound(0, snakeCount - 1);

        socket.once("snake/cancelrank", () => {
            cancelled = true;
            if (gameID) {
                removeFromQueue(gameID);
            }
            socket.emit("snake/rank", { cancel: true });
        })
    });
};

module.exports = { snakeRouter: router, snakeSocketHandlers: socketHandlers };