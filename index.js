`use strict`

const express = require("express");
const fs = require("fs");
const fse = require("fs-extra");
const { exec } = require('child_process');
const path = require("path");
const app = express();

const port = process.env.PORT || 8000;

const snakeTemplatePath = "./SnakeJava";
const snakePath = "./SnakeJava0";

const forceHTTPS = (req, res, next) => {
    if (req.protocol === "https" || req.headers.host.split(":")[0] === "localhost") {
        next();
    } else {
        res.redirect("https://" + req.headers.host + req.url);
    }
}

app.enable('trust proxy');
app.use(forceHTTPS);


app.get("/api/submitsnake", (req, res) => {
    console.log("Snake submitted");

    if (!req.query.code) {
        res.json({err: "Code not provided"});
        return;
    }

    // Copy ./SnakeJava to ./SnakeJavaCopy or wherever
    // Write req.query.code to ./SnakeJavaCopy/Snake.java
    // Run javac SnakeJavaCopy/*
    // Run java -cp ./SnakeJavaCopy Program

    try {
        fs.rmSync(snakePath, {recursive: true, force: true});
        console.log("Removed");
    } catch (err) {
        console.log({err, part: "Remove"});
        res.json({err});
        return;
    }
    try {
        fse.copySync(snakeTemplatePath, snakePath);
    } catch (err) {
        console.log({err, part: "Copy"});
        res.json({err});
            return;
    }
    console.log("Copied");
    try {
        fs.writeFileSync(path.join(snakePath, "Snake.java"), req.query.code);
        console.log("Wrote");
    } catch (err) {
        console.log({err, part: "Write"});
        res.json({err});
            return;
    }
    exec(`javac ${path.join(snakePath, "*.java")}`, (err, stdout, stderr) => {
        if (err) {
            console.log({err, part: "Compile"});
            res.json({err, stdout, stderr});
            return;
        }
        console.log("Compiled");
        exec(`java -cp ${snakePath} Program`, (err, stdout, stderr) => {
            if (err) {
                console.log({err, part: "Execute"});
                res.json({err, stdout, stderr});
                return;
            }
            console.log("Executed");
            res.json({stdout, stderr});
        });
    });    
});


app.use((req, res, next) => {
    req.method = "GET";
    next();
});

const _app_folder = './frontend/dist/frontend';

app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));
app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, { root: _app_folder });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
