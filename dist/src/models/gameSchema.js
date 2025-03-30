"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const gameSchema = new mongoose_1.default.Schema({
    game_code: {
        type: String,
        required: true,
        unique: true
    },
    host: {
        type: "string"
    },
    playlist: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Playlist"
    },
    game_type: {
        type: String,
        enum: ["tournament", "group", "solo"]
    },
    gameStatus: {
        type: String,
        enum: ["not-started", "started", "completed"],
        default: "not-started"
    },
    players: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User"
        }]
}, { timestamps: true });
const Game = mongoose_1.default.model("Game", gameSchema);
exports.default = Game;
