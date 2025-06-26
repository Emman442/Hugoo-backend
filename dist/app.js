"use strict";
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
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const playlistRoutes_1 = __importDefault(require("./src/routes/playlistRoutes"));
const songRoutes_1 = __importDefault(require("./src/routes/songRoutes"));
const gameRoutes_1 = __importDefault(require("./src/routes/gameRoutes"));
const errorController_1 = __importDefault(require("./src/controllers/errorController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000; // Default to 5000 if not set
const version = "v1";
// Middleware
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// Cloudinary Setup
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// CORS Configuration
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use((0, cors_1.default)(corsOptions));
// MongoDB Connection
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database connected successfully!"))
    .catch((err) => console.error("❌ Database connection error:", err));
// Routes
app.use(`/api/${version}/users`, userRoutes_1.default);
app.use(`/api/${version}/playlists`, playlistRoutes_1.default);
app.use(`/api/${version}/song`, songRoutes_1.default);
app.use(`/api/${version}/game`, gameRoutes_1.default);
app.use(errorController_1.default);
// Create HTTP Server
const httpServer = (0, http_1.createServer)(app);
// Configure Socket.io
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});
// A dictionary to hold rooms and players
const gameRooms = {};
const socketToRoom = {};
io.on("connection", (socket) => {
    console.log("🔗 Socket Connected:", socket.id);
    // Don't require gameCode and player from handshake query
    // We'll handle room joining through the join_game event
    socket.on("join_game", (data) => {
        console.log("🎮 Join game event received:", data);
        const { game_code, address, isHost = false } = data;
        const newRoom = game_code.toString();
        // Leave old room if any
        const oldRoom = socketToRoom[socket.id];
        if (oldRoom && oldRoom !== newRoom) {
            console.log(`👋 Player socket ${socket.id} leaving old room ${oldRoom} before joining ${newRoom}`);
            socket.leave(oldRoom);
            if (gameRooms[oldRoom]) {
                gameRooms[oldRoom] = gameRooms[oldRoom].filter(p => p.socketId !== socket.id);
                io.to(oldRoom).emit("lobby_update", gameRooms[oldRoom]);
            }
            delete socketToRoom[socket.id]; // Important to clean up old room mapping
        }
        // Join new room
        socket.join(newRoom);
        socketToRoom[socket.id] = newRoom;
        console.log(`🚪 Player joined room: ${newRoom}`);
        // Initialize room if it doesn't exist
        if (!gameRooms[newRoom]) {
            gameRooms[newRoom] = [];
        }
        // Check if player is already in the room (avoid duplicates)
        const existingPlayerIndex = gameRooms[newRoom].findIndex(p => p.player === address);
        if (existingPlayerIndex >= 0) {
            // Update existing player's socket ID and host status
            gameRooms[newRoom][existingPlayerIndex].socketId = socket.id;
            if (isHost) {
                gameRooms[newRoom][existingPlayerIndex].isHost = true;
            }
            console.log("🔄 Updated existing player in room");
        }
        else {
            // Add new player to the room
            const newPlayer = {
                player: address,
                socketId: socket.id,
                status: "Ready",
                isHost: isHost || gameRooms[newRoom].length === 0 // First player is host if no host specified
            };
            gameRooms[newRoom].push(newPlayer);
            console.log("➕ Added new player to room:", newPlayer);
            // Send join message for new players
            socket.to(newRoom).emit("game_message", {
                player: "System",
                message: `${address.substring(0, 6)}...${address.substring(address.length - 4)} has joined the game!`,
                isSystemMessage: true,
                timestamp: new Date()
            });
        }
        console.log(`📊 Room ${newRoom} now has ${gameRooms[newRoom].length} players:`, gameRooms[newRoom]);
        // Send updated lobby to all players in the room
        io.to(newRoom).emit("lobby_update", gameRooms[newRoom]);
    });
    socket.on("start_game", (data) => {
        console.log("🚀 Start game event received:", data);
        const { game_code, host } = data;
        const currentRoom = game_code || socketToRoom[socket.id];
        if (!currentRoom) {
            console.log("❌ No room found for start_game event");
            return socket.emit("error", "No room found");
        }
        // Verify the sender is the host
        const room = gameRooms[currentRoom];
        const hostPlayer = room === null || room === void 0 ? void 0 : room.find(p => p.isHost && p.socketId === socket.id);
        if (!hostPlayer) {
            console.log("❌ Unauthorized start game attempt");
            return socket.emit("error", "Only the host can start the game");
        }
        if (!room || room.length < 2) {
            console.log("❌ Not enough players to start game");
            return socket.emit("error", "At least 2 players required to start the game");
        }
        console.log(`🎯 Game started for room ${currentRoom} by host ${host}`);
        console.log(`👥 Players in game:`, room.map(p => p.player));
        // Broadcast to everyone in the room (including host)
        io.to(currentRoom).emit("game_started", {
            message: "Game is starting!",
            players: room,
            timestamp: new Date()
        });
        // Send system message
        io.to(currentRoom).emit("game_message", {
            player: "System",
            message: "🎮 Game has started! Get ready!",
            isSystemMessage: true,
            timestamp: new Date()
        });
    });
    socket.on("send_message", (message) => {
        const currentRoom = socketToRoom[socket.id];
        if (!currentRoom) {
            console.log("❌ No room found for send_message");
            return;
        }
        const room = gameRooms[currentRoom];
        const sender = room === null || room === void 0 ? void 0 : room.find(p => p.socketId === socket.id);
        if (!sender) {
            console.log("❌ Sender not found in room");
            return;
        }
        console.log("💬 Message sent:", { player: sender.player, message, room: currentRoom });
        // Broadcast to everyone in the room (including sender for consistency)
        io.to(currentRoom).emit("game_message", {
            player: sender.player,
            message: message,
            isSystemMessage: false,
            timestamp: new Date()
        });
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected:", socket.id);
        const currentRoom = socketToRoom[socket.id];
        if (currentRoom && gameRooms[currentRoom]) {
            const disconnectedPlayer = gameRooms[currentRoom].find(p => p.socketId === socket.id);
            // Remove player from room
            gameRooms[currentRoom] = gameRooms[currentRoom].filter(p => p.socketId !== socket.id);
            if (disconnectedPlayer) {
                console.log(`👋 Player ${disconnectedPlayer.player} left room ${currentRoom}`);
                // Notify other players
                socket.to(currentRoom).emit("game_message", {
                    player: "System",
                    message: `${disconnectedPlayer.player.substring(0, 6)}...${disconnectedPlayer.player.substring(disconnectedPlayer.player.length - 4)} has left the game.`,
                    isSystemMessage: true,
                    timestamp: new Date()
                });
                // Update lobby
                io.to(currentRoom).emit("lobby_update", gameRooms[currentRoom]);
            }
            // Clean up room if empty
            if (gameRooms[currentRoom].length === 0) {
                delete gameRooms[currentRoom];
                console.log(`🗑️ Cleaned up empty room: ${currentRoom}`);
            }
            delete socketToRoom[socket.id];
        }
    });
    // Error handling
    socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
    });
});
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
