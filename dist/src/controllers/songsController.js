"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSongToPlaylist = void 0;
const songSchema_1 = __importDefault(require("../models/songSchema"));
const playlistSchema_1 = __importDefault(require("../models/playlistSchema"));
const appError_1 = __importDefault(require("../utils/appError"));
const addSongToPlaylist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playlist = yield playlistSchema_1.default.findById(req.params.playlistId);
        if (!playlist) {
            return next(new appError_1.default("Playlist with that ID Not Found", 404));
        }
        const newSong = yield songSchema_1.default.create({
            artist: req.body.artist,
            song_name: req.body.song_name,
            url: req.body.url,
            playlist: req.params.playlistId
        });
        playlist.songs.push(newSong._id);
        yield playlist.save();
        res.status(200).json({
            status: "success",
            data: {
                newSong
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.addSongToPlaylist = addSongToPlaylist;
