import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    game_code: {
        type: String,
        required: true,
        unique: true
    },
    host: {
        type: "string"
    },
    playlist: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Playlist"
    },
    game_type: {
        type: String,
        enum: ["tournament", "group", "solo"]
    },
    gameStatus: {
        type: String,
        enum: ["not-started","started","completed"],
        default: "not-started"
    },
    total_pot: {
        type: String
    },
    players: [{
        type: String
    }]
}, {timestamps: true})

const Game = mongoose.model("Game", gameSchema);
export default Game;