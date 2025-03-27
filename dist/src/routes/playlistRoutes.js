"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlaylistController_1 = require("../controllers/PlaylistController");
const router = (0, express_1.Router)();
router.post("/create-playlist", PlaylistController_1.createPlaylist);
exports.default = router;
