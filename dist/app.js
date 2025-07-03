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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const gameRoomSchema_1 = __importDefault(require("./src/models/gameRoomSchema"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const playlistRoutes_1 = __importDefault(require("./src/routes/playlistRoutes"));
const songRoutes_1 = __importDefault(require("./src/routes/songRoutes"));
const gameRoutes_1 = __importDefault(require("./src/routes/gameRoutes"));
const errorController_1 = __importDefault(require("./src/controllers/errorController"));
const generateRounds_1 = require("./src/utils/generateRounds");
const PlaylistController_1 = require("./src/controllers/PlaylistController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const version = "v1";
// Middlewares
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// MongoDB Connection
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database connected successfully!"))
    .catch((err) => console.error("❌ Database connection error:", err));
// API Routes
app.use(`/api/${version}/users`, userRoutes_1.default);
app.use(`/api/${version}/playlists`, playlistRoutes_1.default);
app.use(`/api/${version}/song`, songRoutes_1.default);
app.use(`/api/${version}/game`, gameRoutes_1.default);
app.use(errorController_1.default);
// Socket.io Setup
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
const gameRooms = {};
const socketToRoom = {};
const gameStates = {};
io.on("connection", (socket) => {
    // Fixed join_game event handler
    socket.on("join_game", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { game_code, address, isHost, playlistId } = data;
        const newRoom = game_code.toString();
        const oldRoom = socketToRoom[socket.id];
        if (oldRoom && oldRoom !== newRoom) {
            socket.leave(oldRoom);
            gameRooms[oldRoom] = ((_a = gameRooms[oldRoom]) === null || _a === void 0 ? void 0 : _a.filter(p => p.socketId !== socket.id)) || [];
            io.to(oldRoom).emit("lobby_update", gameRooms[oldRoom]);
            delete socketToRoom[socket.id];
        }
        socket.join(newRoom);
        socketToRoom[socket.id] = newRoom;
        if (!gameRooms[newRoom])
            gameRooms[newRoom] = [];
        const existingPlayer = gameRooms[newRoom].find(p => p.player === address);
        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            if (isHost)
                existingPlayer.isHost = true;
        }
        else {
            const newPlayer = {
                player: address,
                socketId: socket.id,
                status: "Ready",
                isHost: isHost || gameRooms[newRoom].length === 0,
                score: 0,
            };
            gameRooms[newRoom].push(newPlayer);
        }
        // ✅ FIXED: Proper gameState creation/restoration
        if (!gameStates[newRoom]) {
            console.log(`🎮 No gameState found for room ${newRoom}, checking DB...`);
            const dbRoom = yield gameRoomSchema_1.default.findOne({ gameCode: newRoom });
            if (dbRoom) {
                gameStates[newRoom] = {
                    gameCode: dbRoom.gameCode,
                    hostPlaylistId: dbRoom.hostPlaylistId,
                    currentRound: dbRoom.currentRound,
                    totalRounds: dbRoom.totalRounds,
                    gamePhase: dbRoom.gamePhase,
                    rounds: dbRoom.rounds.map((round, idx) => {
                        var _a, _b;
                        return (Object.assign(Object.assign({}, round), { startTime: (_a = round.startTime) !== null && _a !== void 0 ? _a : 0, syncTimestamp: (_b = round.syncTimestamp) !== null && _b !== void 0 ? _b : 0 }));
                    }),
                    playersAnswered: new Set(),
                };
                console.log(`✅ Restored gameState for room ${newRoom} from DB`);
            }
            else {
                // ✅ FIXED: Ensure playlistId is properly set
                gameStates[newRoom] = {
                    gameCode: newRoom,
                    hostPlaylistId: playlistId || null, // Set from the joining player's data
                    currentRound: 1,
                    totalRounds: 5,
                    gamePhase: 'lobby',
                    rounds: [],
                    playersAnswered: new Set(),
                };
                console.log(`✅ Created new gameState for room ${newRoom} with playlistId: ${playlistId}`);
            }
        }
        else {
            if (playlistId && (!gameStates[newRoom].hostPlaylistId || isHost)) {
                gameStates[newRoom].hostPlaylistId = playlistId;
            }
        }
        io.to(newRoom).emit("lobby_update", gameRooms[newRoom]);
        // socket.emit("game_message", {
        //     player: "System",
        //     message: `${address.substring(0, 6)}...${address.substring(address.length - 4)} has joined the game.`,
        //     isSystemMessage: true,
        //     timestamp: new Date()
        // });
        yield saveRoomState(newRoom);
    }));
    socket.on("start_game", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { game_code, host, playlistId } = data;
        const currentRoom = game_code || socketToRoom[socket.id];
        if (!currentRoom) {
            console.log("❌ No room found for start_game");
            return socket.emit("error", "No room found");
        }
        const players = gameRooms[currentRoom];
        let gameState = gameStates[currentRoom];
        if (!gameState) {
            console.log("🎮 No gameState found, checking DB...");
            const dbRoom = yield gameRoomSchema_1.default.findOne({ gameCode: currentRoom });
            if (dbRoom) {
                gameStates[currentRoom] = {
                    gameCode: dbRoom.gameCode,
                    hostPlaylistId: dbRoom.hostPlaylistId,
                    currentRound: dbRoom.currentRound,
                    totalRounds: dbRoom.totalRounds,
                    gamePhase: dbRoom.gamePhase,
                    rounds: dbRoom.rounds.map((round, idx) => {
                        var _a, _b;
                        return (Object.assign(Object.assign({}, round), { startTime: (_a = round.startTime) !== null && _a !== void 0 ? _a : 0, syncTimestamp: (_b = round.syncTimestamp) !== null && _b !== void 0 ? _b : 0 }));
                    }),
                    playersAnswered: new Set(),
                };
                gameState = gameStates[currentRoom];
            }
            else {
                console.log("❌ No gameState found in memory or DB");
                return socket.emit("error", "Game state not found");
            }
        }
        if (!gameState.hostPlaylistId && playlistId) {
            gameState.hostPlaylistId = playlistId;
            console.log(`✅ Set missing hostPlaylistId to ${playlistId}`);
        }
        if (!gameState.hostPlaylistId) {
            console.log("❌ No hostPlaylistId found");
            return socket.emit("error", "Playlist not found. Please select a playlist.");
        }
        if (!players || players.length < 2) {
            console.log("❌ Not enough players:", players === null || players === void 0 ? void 0 : players.length);
            return socket.emit("error", "At least 2 players required");
        }
        const isHost = players === null || players === void 0 ? void 0 : players.find(p => p.isHost && p.player === host);
        console.log("🎮 Host check:", { host, isHost: !!isHost });
        if (!isHost) {
            console.log("❌ Host verification failed");
            return socket.emit("error", "Only the host can start the game");
        }
        try {
            const playlist = yield (0, PlaylistController_1.fetchPlaylistFromDatabase)(gameState.hostPlaylistId);
            if (!playlist || playlist.songs.length < 4) {
                console.log("❌ Playlist validation failed:", {
                    exists: !!playlist,
                    songCount: (_a = playlist === null || playlist === void 0 ? void 0 : playlist.songs) === null || _a === void 0 ? void 0 : _a.length
                });
                return socket.emit("error", "Playlist needs at least 4 songs");
            }
            console.log("🎮 Generating game rounds with sync...");
            gameState.rounds = (0, generateRounds_1.generateGameRounds)(playlist.songs, 5);
            gameState.gamePhase = "playing";
            gameState.currentRound = 1;
            console.log("🎮 Saving room state...");
            yield saveRoomState(currentRoom);
            console.log("🎮 Emitting game_started to room:", currentRoom);
            io.to(currentRoom).emit("game_started", {
                message: "🎮 Game is starting!",
                players,
                timestamp: new Date(),
                playlist_image: playlist.image,
            });
            console.log("🎮 Emitting system message...");
            io.to(currentRoom).emit("game_message", {
                player: "System",
                message: "🎮 Game has started! Get ready!",
                isSystemMessage: true,
                timestamp: new Date()
            });
            console.log("🎮 Setting synchronized timeout for first round...");
            // Send the first round with synchronization data
            setTimeout(() => {
                const firstRound = gameState.rounds[0];
                const currentTime = Date.now();
                // Add sync data to the round
                const syncedRound = Object.assign(Object.assign({}, firstRound), { syncTimestamp: currentTime, serverDelay: 1000 // Give clients 1 second to prepare
                 });
                console.log("🎮 Emitting synchronized first round:", syncedRound.roundNumber);
                io.to(currentRoom).emit("new_round", syncedRound);
            }, 2000);
        }
        catch (error) {
            console.error("❌ Error starting game:", error);
            socket.emit("error", "Failed to start game");
        }
    }));
    // Update next_round handler as well
    socket.on("next_round", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { game_code } = data;
        const currentRoom = game_code || socketToRoom[socket.id];
        const gameState = gameStates[currentRoom];
        if (!currentRoom || !gameState)
            return;
        gameState.currentRound++;
        if (gameState.currentRound <= gameState.totalRounds) {
            const nextRound = gameState.rounds[gameState.currentRound - 1];
            const currentTime = Date.now();
            // Add sync data to the round
            const syncedRound = Object.assign(Object.assign({}, nextRound), { syncTimestamp: currentTime, serverDelay: 1000 // Give clients 1 second to prepare
             });
            setTimeout(() => {
                io.to(currentRoom).emit("new_round", syncedRound);
            }, 2000);
        }
        else {
            gameState.gamePhase = 'finished';
            const finalScores = gameRooms[currentRoom].map(player => ({
                player: player.player,
                score: player.score,
            }));
            io.to(currentRoom).emit("game_finished", {
                message: "Game completed!",
                players: finalScores,
                timestamp: new Date()
            });
        }
        yield saveRoomState(currentRoom);
    }));
    // Update player_answer handler for automatic progression
    socket.on("player_answer", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { game_code, round, answer, correct, score } = data;
        const currentRoom = game_code;
        const gameState = gameStates[currentRoom];
        const players = gameRooms[currentRoom];
        if (!gameState || !players)
            return;
        // Track this player's answer
        gameState.playersAnswered.add(socket.id);
        // Update player score
        const player = players.find(p => p.socketId === socket.id);
        if (player)
            player.score = score;
        // Check if all players have answered
        const activePlayers = players.length;
        if (gameState.playersAnswered.size >= activePlayers) {
            // All players answered, move to next round
            gameState.playersAnswered.clear(); // Reset for next round
            setTimeout(() => {
                if (gameState.currentRound < gameState.totalRounds) {
                    gameState.currentRound++;
                    const nextRound = gameState.rounds[gameState.currentRound - 1];
                    const currentTime = Date.now();
                    // Add sync data to the round
                    const syncedRound = Object.assign(Object.assign({}, nextRound), { syncTimestamp: currentTime, serverDelay: 1000 });
                    io.to(currentRoom).emit("new_round", syncedRound);
                }
                else {
                    // Game finished
                    gameState.gamePhase = 'finished';
                    const finalScores = players.map(p => ({
                        player: p.player,
                        score: p.score
                    }));
                    io.to(currentRoom).emit("game_finished", {
                        message: "Game completed!",
                        players: finalScores
                    });
                }
            }, 2000);
        }
        yield saveRoomState(currentRoom);
    }));
    socket.on("send_message", (message) => {
        var _a;
        const currentRoom = socketToRoom[socket.id];
        const sender = (_a = gameRooms[currentRoom]) === null || _a === void 0 ? void 0 : _a.find(p => p.socketId === socket.id);
        if (!currentRoom || !sender)
            return;
        io.to(currentRoom).emit("game_message", {
            player: sender.player,
            message,
            isSystemMessage: false,
            timestamp: new Date()
        });
    });
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const currentRoom = socketToRoom[socket.id];
        if (!currentRoom)
            return;
        const disconnectedPlayer = (_a = gameRooms[currentRoom]) === null || _a === void 0 ? void 0 : _a.find(p => p.socketId === socket.id);
        gameRooms[currentRoom] = (_b = gameRooms[currentRoom]) === null || _b === void 0 ? void 0 : _b.filter(p => p.socketId !== socket.id);
        if (disconnectedPlayer) {
            socket.to(currentRoom).emit("game_message", {
                player: "System",
                message: `${disconnectedPlayer.player.substring(0, 6)}...${disconnectedPlayer.player.substring(disconnectedPlayer.player.length - 4)} has left the game.`,
                isSystemMessage: true,
                timestamp: new Date()
            });
            io.to(currentRoom).emit("lobby_update", gameRooms[currentRoom]);
        }
        if (((_c = gameRooms[currentRoom]) === null || _c === void 0 ? void 0 : _c.length) === 0) {
            delete gameRooms[currentRoom];
            delete gameStates[currentRoom];
            yield gameRoomSchema_1.default.deleteOne({ gameCode: currentRoom });
            console.log(`❌ Deleted room ${currentRoom} from DB because it's now empty`);
        }
        else {
            yield saveRoomState(currentRoom);
        }
        delete socketToRoom[socket.id];
    }));
    socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
    });
});
httpServer.listen(PORT, () => {
    loadRoomsOnStartup();
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
function saveRoomState(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const players = gameRooms[roomCode];
        const gameState = gameStates[roomCode];
        if (!players || !gameState)
            return;
        try {
            yield gameRoomSchema_1.default.findOneAndUpdate({ gameCode: roomCode }, {
                gameCode: roomCode,
                players: players.map(p => ({
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
            const rooms = yield gameRoomSchema_1.default.find({});
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
                    rounds: room.rounds.map((round) => {
                        var _a, _b;
                        return (Object.assign(Object.assign({}, round), { startTime: (_a = round.startTime) !== null && _a !== void 0 ? _a : 0, syncTimestamp: (_b = round.syncTimestamp) !== null && _b !== void 0 ? _b : 0 }));
                    }),
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
