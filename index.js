`use strict`

const express = require("express");
const fs = require("fs");
const fse = require("fs-extra");
const { exec } = require('child_process');
const path = require("path");
const app = express();
const {OAuth2Client} = require('google-auth-library');


const CLIENT_ID = "527633665148-g2dignt1vnbt5o5imcpkh5s80jinckcr.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const initialHeapSize = 1024 * 1024 * 2;
// The default size is 2097152 (2MB). 
// The value must be a multiple of, and greater than, 1024 bytes (1KB).

const maxHeapSize = 1024 * 1024 * 64;
// The default size is 67108864 (64MB). 
// The value must be a multiple of, and greater than, 1024 bytes (1KB).

const threadStackSize = 1024 * 512;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const requireLogin = async (req, res, next) => {
    if (!req.query?.token && !req.body?.token) {
        res.sendStatus(401);
        return;
    }
    const token = req.query.token || req.body.token;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload();
        const domain = payload["hd"];
        if (domain !== "cam.ac.uk") {
            res.sendStatus(401);
            return;
        }
        req.userid = payload["sub"];
        next();
    } catch (err) {
        console.log(err);
        res.sendStatus(401);
        return;
    }
};

app.get("/api/submitsnake", requireLogin, (req, res) => {
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
        exec(`java -Djava.security.manager -Djava.security.policy==./snake.policy -Xms${initialHeapSize} -Xmx${maxHeapSize} -Xss${threadStackSize} -cp ${snakePath} Program`, (err, stdout, stderr) => {
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
