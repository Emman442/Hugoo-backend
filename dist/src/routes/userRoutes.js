"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const userController_1 = require("../controllers/userController");
const imageUpload_1 = __importDefault(require("../utils/imageUpload"));
const router = express_1.default.Router();
router.post("/", authController_1.createUser);
router.get("/", userController_1.getAllUsers);
router.post("/update-user/:address", imageUpload_1.default.single("photo"), userController_1.updateUser);
exports.default = router;
