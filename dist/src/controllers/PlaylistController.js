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
exports.updatePlaylist = exports.deletePlaylistById = exports.getPlaylistById = exports.getPlaylists = exports.createPlaylist = void 0;
exports.fetchPlaylistFromDatabase = fetchPlaylistFromDatabase;
const playlistSchema_1 = __importDefault(require("../models/playlistSchema"));
const upload_1 = require("../utils/upload");
const appError_1 = __importDefault(require("../utils/appError"));
const createPlaylist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description, mode } = req.body;
    const image = yield (0, upload_1.uploadFile)((_a = req.file) === null || _a === void 0 ? void 0 : _a.path);
    const newPlaylist = yield playlistSchema_1.default.create({
        name,
        description,
        image: image === null || image === void 0 ? void 0 : image.secure_url,
        mode
    });
    res.status(200).json({
        status: "success",
        data: {
            newPlaylist
        }
    });
});
exports.createPlaylist = createPlaylist;
const getPlaylists = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filter } = req.query;
        let sortOptions = {};
        if (filter === "updated-recently") {
            sortOptions = { updatedAt: -1 };
        }
        else if (filter === "added-recently") {
            sortOptions = { createdAt: -1 };
        }
        const playlists = yield playlistSchema_1.default.find({})
            .sort(sortOptions)
            .populate({
            path: "songs",
            select: "artist song_name url",
        });
        res.status(200).json({
            status: "success",
            data: { playlists },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getPlaylists = getPlaylists;
const getPlaylistById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playlistId = req.params.playlistId;
        const playlist = yield playlistSchema_1.default.findById(playlistId).populate("songs");
        if (!playlist) {
            return next(new appError_1.default("No Playlist with that ID was found!", 404));
        }
        res.status(200).json({
            status: "success",
            data: { playlist },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getPlaylistById = getPlaylistById;
const deletePlaylistById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playlistId = req.params.playlistId;
        const playlist = yield playlistSchema_1.default.findById(playlistId);
        if (!playlist) {
            return next(new appError_1.default("No Playlist with that ID was found!", 404));
        }
        yield playlistSchema_1.default.findByIdAndDelete(playlistId);
        res.status(200).json({
            status: "success",
            data: null
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deletePlaylistById = deletePlaylistById;
const updatePlaylist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { playlistId } = req.params;
        const playlist = yield playlistSchema_1.default.findById(playlistId);
        if (!playlist) {
            return next(new appError_1.default("No Playlist with that ID was found", 404));
        }
        if (req.file) {
            const image = yield (0, upload_1.uploadFile)(req.file.path);
            playlist.image = image.secure_url;
        }
        if (req.body.name) {
            playlist.name = req.body.name;
        }
        if (req.body.description) {
            playlist.description = req.body.description;
        }
        yield playlist.save({ validateBeforeSave: false });
        res.status(200).json({
            status: "success",
            data: { playlist },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updatePlaylist = updatePlaylist;
function fetchPlaylistFromDatabase(playlistId) {
    return __awaiter(this, void 0, void 0, function* () {
        const playlist = yield playlistSchema_1.default.findById(playlistId).populate("songs");
        // if(!playlist){
        //     return new Error("Playlist Not found")
        // }
        return playlist;
    });
}
2;
