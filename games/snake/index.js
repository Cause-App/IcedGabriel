const express = require("express");
const { db, requireLogin } = require("../../common");
const fs = require("fs");
const fse = require("fs-extra");
const { exec } = require('child_process');
const path = require("path");
const mongo = require('mongodb')

const initialHeapSize = 1024 * 1024 * 2;
// The default size is 2097152 (2MB). 
// The value must be a multiple of, and greater than, 1024 bytes (1KB).

const maxHeapSize = 1024 * 1024 * 64;
// The default size is 67108864 (64MB). 
// The value must be a multiple of, and greater than, 1024 bytes (1KB).

const threadStackSize = 1024 * 512;
const snakeTemplatePath = "./SnakeJava";
const snakePath = "./SnakeJava0";


const router = express.Router();

router.get("/getsnakes", requireLogin, (req, res) => {
    const snakeCollection = db.db.collection("snake");

    snakeCollection.find({owner: req.userid}).toArray((err, docs) => {
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
        res.json({err: "Failed to update snake. Snake name too long"});
        return;
    }

    if (id && id.length > 32) {
        res.json({err: "Failed to update snake. Snake id too long"});
        return;
    }

    if (!req.body.code) {
        res.json({err: "Failed to update snake. Code files were not uploaded properly"});
        return;
    }

    if (JSON.stringify(req.body.code).length > 1024 * 1024) {
        res.json({err: "Failed to update snake. Code files too big"});
    }

    if (!Array.isArray(req.body.code)) {
        res.json({err: "Failed to update snake. Code files were not uploaded properly"});
        return;
    }

    if (req.body.code.length > 16) {
        res.json({err: "Failed to update snake. Too many code files"});
    }

    const sanitizedFiles = [];
    for (const file of req.body.code) {
        const {filename, code, protected} = file;
        if (!filename) {
            res.json({err: "Failed to update snake. Code file malformed"});
            return;
        }
        sanitizedFiles.push({filename, code: code || "", protected});
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
                    res.json({err});
                    return;
                }
                res.json({});
            }
        )
    } else {
        const toInsert = {
            owner: req.userid,
            name: name,
            code: sanitizedFiles
        };
        snakeCollection.insertOne(
            toInsert,
            (err) => {
                if (err) {
                    console.err(err);
                    res.json({err});
                    return;
                }
                res.json({id: toInsert._id});
            }
        )
    }
})

router.get("/submitsnake", requireLogin, (req, res) => {
    console.log("Snake submitted");

    if (!req.query.code) {
        res.json({ err: "Code not provided" });
        return;
    }

    // Copy ./SnakeJava to ./SnakeJavaCopy or wherever
    // Write req.query.code to ./SnakeJavaCopy/Snake.java
    // Run javac SnakeJavaCopy/*
    // Run java -cp ./SnakeJavaCopy Program

    try {
        fs.rmSync(snakePath, { recursive: true, force: true });
        console.log("Removed");
    } catch (err) {
        console.log({ err, part: "Remove" });
        res.json({ err });
        return;
    }
    try {
        fse.copySync(snakeTemplatePath, snakePath);
    } catch (err) {
        console.log({ err, part: "Copy" });
        res.json({ err });
        return;
    }
    console.log("Copied");
    try {
        fs.writeFileSync(path.join(snakePath, "Snake.java"), req.query.code);
        console.log("Wrote");
    } catch (err) {
        console.log({ err, part: "Write" });
        res.json({ err });
        return;
    }
    exec(`javac ${path.join(snakePath, "*.java")}`, (err, stdout, stderr) => {
        if (err) {
            console.log({ err, part: "Compile" });
            res.json({ err, stdout, stderr });
            return;
        }
        console.log("Compiled");
        exec(`unset JAVA_TOOL_OPTIONS && java -Djava.security.manager -Djava.security.policy==./snake.policy -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${snakePath} Program`, (err, stdout, stderr) => {
            if (err) {
                console.log({ err, part: "Execute" });
                res.json({ err, stdout, stderr });
                return;
            }
            console.log("Executed");
            res.json({ stdout, stderr });
        });
    });
});

module.exports = router;