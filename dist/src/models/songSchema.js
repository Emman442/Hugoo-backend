"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const songSchema = new mongoose_1.default.Schema({
    artist: {
        type: String,
        required: true
    },
    song_name: { type: String },
    url: { type: String, required: true },
    playlist: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Playlist"
    },
}, { timestamps: true });
const Song = mongoose_1.default.model("Song", songSchema);
exports.default = Song;
