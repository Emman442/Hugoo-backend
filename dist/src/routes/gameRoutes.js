"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameController_1 = require("../controllers/gameController");
const router = (0, express_1.Router)();
router.post("/", gameController_1.createGame);
router.post("/join", gameController_1.joinGame);
exports.default = router;
