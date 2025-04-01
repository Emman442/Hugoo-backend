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
exports.joinGame = exports.createGame = void 0;
const gameSchema_1 = __importDefault(require("../models/gameSchema"));
const appError_1 = __importDefault(require("../utils/appError"));
const createGame = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("req.body: ", req.body);
    const { game_code, host, playlist } = req.body;
    console.log("Game code", game_code);
    try {
        const newGame = new gameSchema_1.default({
            game_code,
            host,
            playlist,
            gameStatus: "not-started"
        });
        newGame.players.push(host);
        yield newGame.save();
    }
    catch (error) {
        next(error);
    }
});
exports.createGame = createGame;
const joinGame = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_addr = req.body.address;
        const { game_code } = req.body;
        const isValidGameCode = yield gameSchema_1.default.findOne({
            game_code: { $eq: game_code }
        });
        if (!isValidGameCode) {
            console.log("not validdd");
            return next(new appError_1.default("Invalid Game Code", 400));
        }
        const game = yield gameSchema_1.default.findByIdAndUpdate(isValidGameCode._id, // The ID of the game document
        { $push: { players: user_addr } }, { new: true });
        res.status(200).json({
            status: "success",
            data: {
                game
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.joinGame = joinGame;
