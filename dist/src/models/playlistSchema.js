"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const playlistSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    images: [
        { type: String }
    ],
    image: { type: String, required: true },
    description: { type: String },
    songs: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Song"
        }],
    mode: {
        type: String,
        default: "easy",
        enum: ["easy", "medium", "hard"]
    }
});
const Playlist = mongoose_1.default.model("Playlist", playlistSchema);
exports.default = Playlist;
