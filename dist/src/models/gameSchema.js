"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const gameSchema = new mongoose_1.default.Schema({
    game_code: {
        type: String,
        required: true
    },
    players: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User"
        }]
}, { timestamps: true });
const Game = mongoose_1.default.model("Game", gameSchema);
module.exports = Game;
