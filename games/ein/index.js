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
const unoCodePath = "./GameCode/Ein";


const MOVE_MAX_MILLIS = 50;
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
    const unoLbCollection = db.db.collection("unoleaderboard");
    const result = await unoLbCollection.aggregate([
        { $sort: { 'rank': 1 } },
        { $group: { _id: '$owner', group: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: "$group" } }
    ]).project({code: false}).sort({"rank": 1}).toArray();
    res.json(result);
});

router.get("/mine", requireLogin, (req, res) => {
    let unoCollection = req.query.leaderboard ? db.db.collection("unoleaderboard") : db.db.collection("uno");

    unoCollection.find({ owner: req.userid }).toArray(async (err, docs) => {
        if (err) {
            console.err(err);
            res.json([]);
            return;
        }
        res.json(docs);
    });
});

router.get("/getallplayers", requireLogin, (req, res) => {
    const unoCollection = db.db.collection("uno");

    unoCollection.find().project({ code: false }).toArray((err, docs) => {
        if (err) {
            console.err(err);
            res.json([]);
            return;
        }
        res.json(docs);
    });
});

router.post("/editplayer", requireLogin, (req, res) => {
    const unoCollection = db.db.collection("uno");

    const id = req.body.id && req.body.id !== "undefined" ? req.body.id : undefined;

    const name = req.body.name || "An unnamed Ein player";

    if (name.length > 32) {
        res.json({ err: "Failed to update player. Player name too long" });
        return;
    }

    if (id && id.length > 32) {
        res.json({ err: "Failed to update player. Player id too long" });
        return;
    }

    if (!req.body.code) {
        res.json({ err: "Failed to update player. Code files were not uploaded properly" });
        return;
    }

    if (JSON.stringify(req.body.code).length > 1024 * 1024) {
        res.json({ err: "Failed to update player. Code files too big" });
    }

    if (!Array.isArray(req.body.code)) {
        res.json({ err: "Failed to update player. Code files were not uploaded properly" });
        return;
    }

    if (req.body.code.length > 16) {
        res.json({ err: "Failed to update player. Too many code files" });
    }

    const sanitizedFiles = [];
    for (const file of req.body.code) {
        const { filename, code, protected } = file;
        if (!filename) {
            res.json({ err: "Failed to update player. Code file malformed" });
            return;
        }
        if (!filenameValid(filename)) {
            res.json({ err: "Failed to update player. File name invalid" });
            return;
        }
        sanitizedFiles.push({ filename, code: code || "", protected });
    }

    if (id) {
        unoCollection.updateOne(
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
        unoCollection.insertOne(
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

router.get("/deleteplayer", requireLogin, (req, res) => {
    const unoCollection = db.db.collection("uno");
    const unoLbCollection = db.db.collection("unoleaderboard");

    const id = req.query.id && req.query.id !== "undefined" ? req.query.id : undefined;

    if (!id) {
        res.json({ err: "No player ID specified" });
        return;
    }

    try {
        unoCollection.deleteOne(
            {
                owner: req.userid,
                _id: mongo.ObjectId(id)
            },
        )
        unoLbCollection.deleteOne(
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
    const unoCollection = db.db.collection("uno");
    const opponentUnoCollection = collection ?? unoCollection

    const s1Query = { _id: mongo.ObjectId(s1ID) };
    if (requireS1Owner) {
        s1Query.owner = requireS1Owner.sub;
    }

    const myUno = await unoCollection.findOne(s1Query);
    if (!myUno) {
        callback({ err: "Your player does not exist or you do not own it" });
        return;
    }

    const opponentUno = await opponentUnoCollection.findOne({ _id: mongo.ObjectId(s2ID) });
    if (!opponentUno) {
        callback({ err: "Your opponent's player does not exist" });
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


    enqueue(playGame, [myUno, opponentUno, callback, listener, !!collection], gameID);
};

const playGame = async (gamePath, myUno, opponentUno, callback, listener, ranked) => {
    try {
        onDequeue.removeListener("dequeue", listener);
        fse.copySync(unoCodePath, gamePath);

        const myUnoPath = path.join(gamePath, "einplayer1");
        const opponentUnoPath = path.join(gamePath, "einplayer2");

        for (const [unoPath, unoCode, package] of [[myUnoPath, myUno.code, "einplayer1"], [opponentUnoPath, opponentUno.code, "einplayer2"]]) {
            fs.mkdirSync(unoPath);

            for (const { filename, code } of unoCode) {
                if (filenameValid(filename)) {
                    const toWrite = filename.endsWith(".java") ? `package ${package};\n${code}` : code;
                    fs.writeFileSync(path.join(unoPath, filename), toWrite);
                }
            }

        }

        await runCommand(`cd ${gamePath} && javac logic/Program.java`);

        const output = await runCommand(`unset JAVA_TOOL_OPTIONS && java -Djava.security.manager -Djava.security.policy==./ein.policy -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${gamePath} logic.Program ${MOVE_MAX_MILLIS} ${ranked ? NUMBER_OF_RANKED_GAMES : -1}`);
        callback(output);

    } catch (err) {
        console.error(err);
        callback({ err });
    }
}

const socketHandlers = (socket) => {
    socket.setMaxListeners(Infinity);
    socket.on("ein/play", async (data, token) => {
        const userData = await validateToken(token);
        if (!userData) {
            socket.emit("ein/play", { err: "Access Denied" });
            return;
        }

        if (!data.myId || !data.opponentId) {
            socket.emit("ein/play", { err: "Player IDs not provided" });
            return;
        }

        const { myId, opponentId } = data;
        let cancelled = false;
        submitGame(myId, opponentId, userData, null, (response) => {
            if (cancelled) {
                return;
            }
            if (response.gameID) {
                socket.once("ein/cancel", () => {
                    removeFromQueue(response.gameID);
                    cancelled = true;
                });
            } else {
                socket.emit("ein/play", response);
            }
        });

    });

    socket.on("ein/rank", async (data, token) => {
        const userData = await validateToken(token);
        if (!userData) {
            socket.emit("ein/rank", { err: "Access Denied" });
            return;
        }

        if (!data.myId) {
            socket.emit("ein/rank", { err: "Player ID not provided" });
            return;
        }

        const { myId } = data;

        const unoCollection = db.db.collection("uno");
        const unoLbCollection = db.db.collection("unoleaderboard");

        const myUno = await unoCollection.findOne({ _id: mongo.ObjectId(myId), owner: userData.sub });
        if (!myUno) {
            socket.emit("ein/rank", { err: "Your player does not exist or you do not own it" });
            return;
        }

        const unoCount = (await unoLbCollection.find({ _id: { $ne: mongo.ObjectId(myId) } }).count());

        const insertAt = async (n) => {
            const currentRank = (await unoLbCollection.findOne({ _id: mongo.ObjectId(myId) }))?.rank;
            const session = db.client.startSession();

            try {
                await session.withTransaction(async () => {
                    if (currentRank !== undefined) {
                        await unoLbCollection.deleteOne({ _id: mongo.ObjectId(myId) });
                        await unoLbCollection.updateMany({ rank: { $gt: currentRank } }, { $inc: { rank: -1 } });
                    }
                    await unoLbCollection.updateMany({ rank: { $gte: n } }, { $inc: { rank: 1 } });
                    await unoLbCollection.insertOne({ _id: mongo.ObjectId(myId), owner: myUno.owner, ownerName: myUno.ownerName, code: myUno.code, name: myUno.name, rank: n });

                    socket.emit("ein/rank", { rank: n });
                });
            } catch (err) {
                console.error(err);
                socket.emit("ein/rank", { err });
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
            socket.emit("ein/rank", { start, end });
            const opponentIndex = Math.floor((start + end) / 2);
            unoLbCollection.find({ _id: { $ne: mongo.ObjectId(myId) } }).sort({ rank: 1 }).skip(opponentIndex).limit(1).forEach((opponentUno) => {
                submitGame(myId, opponentUno._id, userData, unoLbCollection, (response) => {
                    if (cancelled) {
                        return;
                    }
                    if (!response.stdout) {
                        if (response.gameID) {
                            gameID = response.gameID;
                        } else {
                            socket.emit("ein/rank", response);
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

        doRound(0, unoCount - 1);

        socket.once("ein/cancelrank", () => {
            cancelled = true;
            if (gameID) {
                removeFromQueue(gameID);
            }
            socket.emit("ein/rank", { cancel: true });
        })
    });
};

module.exports = { unoRouter: router, unoSocketHandlers: socketHandlers };