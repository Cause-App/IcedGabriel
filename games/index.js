const fs = require("fs");
const path = require("path");
const runningGamesPath = "./RunningGames";
const EventEmitter = require("events");

const MAX_GAMES = 16;

let queue = [];
const onDequeue = new EventEmitter();
onDequeue.setMaxListeners(Infinity);

const enqueue = (game, args, id) => {
    queue.push({ game, args, id });
    if (queue.length === 1) {
        dequeue();
    }
}

const removeFromQueue = (gameID) => {
    queue = queue.filter(({id}) => id !== gameID);
} 

const dequeue = async () => {
    if (queue.length === 0) {
        return;
    }
    try {
        for (let i = 0; i < MAX_GAMES; i++) {
            const gamePath = path.join(runningGamesPath, `Game${i}`);
            if (!fs.existsSync(gamePath)) {
                const [{ game, args }] = queue.splice(0, 1);
                onDequeue.emit("dequeue");
                await game(gamePath, ...args);
                fs.rmSync(gamePath, { recursive: true, force: true });
                dequeue();
                break;
            }
        }
    } catch (err) {
        console.error(err);
        return;
    }

}

module.exports = { enqueue, onDequeue, queue, removeFromQueue };