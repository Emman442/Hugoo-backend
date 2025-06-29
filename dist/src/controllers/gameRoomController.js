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
const GameRoom_1 = __importDefault(require("./src/models/GameRoom"));
function saveRoomState(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const players = gameRooms[roomCode];
        const gameState = gameStates[roomCode];
        if (!players || !gameState)
            return;
        try {
            yield GameRoom_1.default.findOneAndUpdate({ gameCode: roomCode }, {
                gameCode: roomCode,
                players: players.map(p, any => ({
                    player: p.player,
                    isHost: p.isHost,
                    status: p.status,
                    score: p.score,
                })),
                hostPlaylistId: gameState.hostPlaylistId,
                currentRound: gameState.currentRound,
                totalRounds: gameState.totalRounds,
                gamePhase: gameState.gamePhase,
                rounds: gameState.rounds,
            }, { upsert: true, new: true });
            console.log(`✅ Saved room state for ${roomCode}`);
        }
        catch (error) {
            console.error(`❌ Failed to save room state for ${roomCode}:`, error);
        }
    });
}
function loadRoomsOnStartup() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rooms = yield GameRoom_1.default.find({});
            rooms.forEach(room => {
                gameRooms[room.gameCode] = room.players.map(p => ({
                    player: p.player,
                    socketId: '', // Will update when players reconnect
                    isHost: p.isHost,
                    status: p.status,
                    score: p.score,
                }));
                gameStates[room.gameCode] = {
                    gameCode: room.gameCode,
                    hostPlaylistId: room.hostPlaylistId,
                    currentRound: room.currentRound,
                    totalRounds: room.totalRounds,
                    gamePhase: room.gamePhase,
                    rounds: room.rounds,
                    playersAnswered: new Set(),
                };
            });
            console.log(`✅ Loaded ${rooms.length} game rooms from DB on startup`);
        }
        catch (error) {
            console.error("❌ Failed to load rooms from DB:", error);
        }
    });
}
