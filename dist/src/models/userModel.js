"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        // required: [true, "Please provide a name"]
    },
    email: {
        type: String,
        // unique: true
    },
    level: {
        type: Number,
        default: 0
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true
    },
    profile_pic: {
        type: String,
        default: "",
    },
    games_won: {
        type: Number,
        default: 0
    },
    global_score: {
        type: Number,
    },
    username: {
        type: String,
        required: true
    },
    country: {
        type: String,
    },
    total_wagered: {
        type: String
    }
}, { timestamps: true });
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
