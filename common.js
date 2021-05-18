const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = "527633665148-g2dignt1vnbt5o5imcpkh5s80jinckcr.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = { client: mongoClient };

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
        req.name = payload["name"];
        next();
    } catch (err) {
        console.log(err);
        res.sendStatus(401);
        return;
    }
};

module.exports = { db, requireLogin };