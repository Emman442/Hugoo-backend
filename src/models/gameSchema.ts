import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    game_code: {
        type: String,
        required: true
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {timestamps: true})

const Game = mongoose.model("Game", gameSchema);
module.exports=Game;