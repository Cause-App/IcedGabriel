const express = require("express");
const { db, requireLogin, validateToken } = require("../common");
const { enqueue, onDequeue, queue, removeFromQueue } = require("./queue");
const fs = require("fs");
const fse = require("fs-extra");
const { exec } = require('child_process');
const path = require("path");
const mongo = require('mongodb')
const validFilename = require('valid-filename');

const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            console.log({err, stdout, stderr});
            if (err) {
                reject({ err, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

const createGame = (
    id,
    initialHeapSize,
    maxHeapSize,
    threadStackSize,
    args,
    playerCollection,
    leaderboardCollection,
    defaultPlayerName,
    maxCodeJSONLength,
    maxCodeFiles,
    codePackage1,
    codePackage2,
    numberOfRankedGames
) => {
    const router = express.Router();
    const codePath = path.join("./GameCode", id);
    const policyPath = path.join("./policies", id+".policy");

    router.get("/offline", (req, res) => {
        res.download(path.join("./ZippedGameCode", "Game", id+".zip"));
    });

    router.get("/offlineplayer", (req, res) => {
        res.download(path.join("./ZippedGameCode", "Player", id+"-template-player.zip"));
    });


    router.get("/leaderboard", async (req, res) => {
        const lbCollection = leaderboardCollection();
        const result = await lbCollection.aggregate([
            { $sort: { 'rank': 1 } },
            { $group: { _id: '$owner', group: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: "$group" } }
        ]).project({ code: false }).sort({ "rank": 1 }).toArray();
        res.json(result);
    });

    router.get("/mine", requireLogin, (req, res) => {
        let collection = req.query.leaderboard ? leaderboardCollection() : playerCollection();

        collection.find({ owner: req.userid }).toArray(async (err, docs) => {
            if (err) {
                console.error(err);
                res.json([]);
                return;
            }
            res.json(docs);
        });
    });

    router.get("/getallplayers", requireLogin, (req, res) => {

        playerCollection().find().project({ code: false }).toArray((err, docs) => {
            if (err) {
                console.error(err);
                res.json([]);
                return;
            }
            res.json(docs);
        });
    });

    router.post("/editplayer", requireLogin, (req, res) => {
        const id = req.body.id && req.body.id !== "undefined" ? req.body.id : undefined;

        const name = req.body.name || defaultPlayerName;

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

        if (JSON.stringify(req.body.code).length > maxCodeJSONLength) {
            res.json({ err: "Failed to update player. Code files too big" });
        }

        if (!Array.isArray(req.body.code)) {
            res.json({ err: "Failed to update player. Code files were not uploaded properly" });
            return;
        }

        if (req.body.code.length > maxCodeFiles) {
            res.json({ err: "Failed to update player. Too many code files" });
        }

        const sanitizedFiles = [];
        for (const file of req.body.code) {
            const { filename, code, protected } = file;
            if (!filename) {
                res.json({ err: "Failed to update player. Code file malformed" });
                return;
            }
            if (!validFilename(filename)) {
                res.json({ err: "Failed to update player. File name invalid" });
                return;
            }
            sanitizedFiles.push({ filename, code: code || "", protected });
        }

        if (id) {
            playerCollection().updateOne(
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
                        console.error(err);
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
            playerCollection().insertOne(
                toInsert,
                (err) => {
                    if (err) {
                        console.error(err);
                        res.json({ err });
                        return;
                    }
                    res.json({ id: toInsert._id });
                }
            )
        }
    });

    router.get("/deleteplayer", requireLogin, (req, res) => {
        const id = req.query.id && req.query.id !== "undefined" ? req.query.id : undefined;

        if (!id) {
            res.json({ err: "No player ID specified" });
            return;
        }

        try {
            playerCollection().deleteOne(
                {
                    owner: req.userid,
                    _id: mongo.ObjectId(id)
                },
            )
            leaderboardCollection().deleteOne(
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
        const opponentCollection = collection ?? playerCollection()

        const s1Query = { _id: mongo.ObjectId(s1ID) };
        if (requireS1Owner) {
            s1Query.owner = requireS1Owner.sub;
        }

        const myPlayer = await playerCollection().findOne(s1Query);
        if (!myPlayer) {
            callback({ err: "Your player does not exist or you do not own it" });
            return;
        }

        const opponentPlayer = await opponentCollection.findOne({ _id: mongo.ObjectId(s2ID) });
        if (!opponentPlayer) {
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


        enqueue(playGame, [myPlayer, opponentPlayer, callback, listener, !!collection], gameID);
    };

    const playGame = async (gamePath, myPlayer, opponentPlayer, callback, listener, ranked) => {
        try {
            onDequeue.removeListener("dequeue", listener);
            fse.copySync(codePath, gamePath);

            const myCodePath = path.join(gamePath, codePackage1);
            const opponentCodePath = path.join(gamePath, codePackage2);

            for (const [codePath, codeFiles, package] of [[myCodePath, myPlayer.code, codePackage1], [opponentCodePath, opponentPlayer.code, codePackage2]]) {
                fs.mkdirSync(codePath);

                for (const { filename, code } of codeFiles) {
                    if (validFilename(filename)) {
                        const toWrite = filename.endsWith(".java") ? `package ${package};\n${code}` : code;
                        fs.writeFileSync(path.join(codePath, filename), toWrite);
                    }
                }

            }

            await runCommand(`cd ${gamePath} && unset JAVA_TOOL_OPTIONS && javac logic/Program.java`);

            const output = await runCommand(`unset JAVA_TOOL_OPTIONS && java -Djava.security.manager -Djava.security.policy==${policyPath} -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${gamePath} logic.Program ${args.map(x => x.value).join(' ')} ${ranked ? numberOfRankedGames : -1}`);
            callback(output);

        } catch (err) {
            console.error(err);
            callback({ err });
        }
    }

    const socketHandlers = (socket) => {
        socket.setMaxListeners(Infinity);
        socket.on(`${id}/play`, async (data, token) => {
            const userData = await validateToken(token);
            if (!userData) {
                socket.emit(`${id}/play`, { err: "Access Denied" });
                return;
            }

            if (!data.myId || !data.opponentId) {
                socket.emit(`${id}/play`, { err: "Player IDs not provided" });
                return;
            }

            const { myId, opponentId } = data;
            let cancelled = false;
            submitGame(myId, opponentId, userData, null, (response) => {
                if (cancelled) {
                    return;
                }
                if (response.gameID) {
                    socket.once(`${id}/cancel`, () => {
                        removeFromQueue(response.gameID);
                        cancelled = true;
                    });
                } else {
                    socket.emit(`${id}/play`, response);
                }
            });

        });

        socket.on(`${id}/rank`, async (data, token) => {
            const userData = await validateToken(token);
            if (!userData) {
                socket.emit(`${id}/rank`, { err: "Access Denied" });
                return;
            }

            if (!data.myId) {
                socket.emit(`${id}/rank`, { err: "Player ID not provided" });
                return;
            }

            const { myId } = data;

            const myPlayer = await playerCollection().findOne({ _id: mongo.ObjectId(myId), owner: userData.sub });
            if (!myPlayer) {
                socket.emit(`${id}/rank`, { err: "Your player does not exist or you do not own it" });
                return;
            }

            const playerCount = (await leaderboardCollection().find({ _id: { $ne: mongo.ObjectId(myId) } }).count());

            const insertAt = async (n) => {
                const currentRank = (await leaderboardCollection().findOne({ _id: mongo.ObjectId(myId) }))?.rank;
                const session = db.client.startSession();

                try {
                    await session.withTransaction(async () => {
                        if (currentRank !== undefined) {
                            await leaderboardCollection().deleteOne({ _id: mongo.ObjectId(myId) });
                            await leaderboardCollection().updateMany({ rank: { $gt: currentRank } }, { $inc: { rank: -1 } });
                        }
                        await leaderboardCollection().updateMany({ rank: { $gte: n } }, { $inc: { rank: 1 } });
                        await leaderboardCollection().insertOne({ _id: mongo.ObjectId(myId), owner: myPlayer.owner, ownerName: myPlayer.ownerName, code: myPlayer.code, name: myPlayer.name, rank: n });

                        socket.emit(`${id}/rank`, { rank: n });
                    });
                } catch (err) {
                    console.error(err);
                    socket.emit(`${id}/rank`, { err });
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
                socket.emit(`${id}/rank`, { start, end });
                const opponentIndex = Math.floor((start + end) / 2);
                leaderboardCollection().find({ _id: { $ne: mongo.ObjectId(myId) } }).sort({ rank: 1 }).skip(opponentIndex).limit(1).forEach((opponentPlayer) => {
                    submitGame(myId, opponentPlayer._id, userData, leaderboardCollection(), (response) => {
                        if (cancelled) {
                            return;
                        }
                        if (!response.stdout) {
                            if (response.gameID) {
                                gameID = response.gameID;
                            } else {
                                socket.emit(`${id}/rank`, response);
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

            doRound(0, playerCount - 1);

            socket.once(`${id}/cancelrank`, () => {
                cancelled = true;
                if (gameID) {
                    removeFromQueue(gameID);
                }
                socket.emit(`${id}/cancelrank`, { cancel: true });
            })
        });
    };

    return {id, router, socketHandlers};
}

module.exports = createGame;