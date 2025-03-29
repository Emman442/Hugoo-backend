"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const songsController_1 = require("../controllers/songsController");
const router = (0, express_1.Router)();
router.post("/create/:playlistId", songsController_1.addSongToPlaylist);
router.get("/get-songs", songsController_1.fetchSongs);
exports.default = router;
