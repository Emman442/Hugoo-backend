"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlaylistController_1 = require("../controllers/PlaylistController");
const imageUpload_1 = __importDefault(require("../utils/imageUpload"));
const router = (0, express_1.Router)();
router.post("/create-playlist", imageUpload_1.default.single("photo"), PlaylistController_1.createPlaylist);
router.get("/get-playlists", PlaylistController_1.getPlaylists);
router.get("/get-playlist/:playlistId", PlaylistController_1.getPlaylistById);
router.post("/update-playlist/:playlistId", imageUpload_1.default.single("photo"), PlaylistController_1.updatePlaylist);
router.delete("/delete-playlist/:playlistId", PlaylistController_1.deletePlaylistById);
exports.default = router;
