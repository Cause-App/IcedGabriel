const createGame = require("./create");
const { db } = require("../common");

const games = [
    createGame(
        "snake", // Game ID
        1024 * 1024 * 2, // Initial heap size 
        1024 * 1024 * 64, // Max heap size
        1024 * 512, // Thread stack size
        "./GameCode/Snake", // Path to game code
        "./policies/snake.policy", // Path to JVM policy
        [
            {label: "grid_width", value: 16},
            {label: "grid_height", value: 16},
            {label: "max_millis_per_move", value: 50},
            {label: "max_rounds", value: 500},
            {label: "fps", value: 0}
        ], // Command line arguments to be passed to the Java program (not including nunber of games to be played)
        () => db.db.collection("snake"), // Player collection
        () => db.db.collection("snakeleaderboard"), // Leaderboard collection
        "An unnamed snake", // Default player name
        1024 * 1024, // Max code JSON size
        16, // Max number of code files
        "snake1", // Player package 1
        "snake2", // Player package 2
        32 // Number of games to play per opponent in a ranked match
    ),

    createGame(
        "ein", // Game ID
        1024 * 1024 * 2, // Initial heap size 
        1024 * 1024 * 64, // Max heap size
        1024 * 512, // Thread stack size
        "./GameCode/Ein", // Path to game code
        "./policies/ein.policy", // Path to JVM policy
        [
            {label: "max_millis_per_move", value: 50},
            {label: "fps", value: 0}
        ], // Command line arguments to be passed to the Java program (not including nunber of games to be played)
        () => db.db.collection("ein"), // Player collection
        () => db.db.collection("einleaderboard"), // Leaderboard collection
        "An unnamed Ein player", // Default player name
        1024 * 1024, // Max code JSON size
        16, // Max number of code files
        "einplayer1", // Player package 1
        "einplayer2", // Player package 2
        32 // Number of games to play per opponent in a ranked match
    )
]

module.exports = { games };