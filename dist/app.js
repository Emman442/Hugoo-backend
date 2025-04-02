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
io.on("connection", (socket) => {
    console.log("Socket Conntected", socket.id);
    const { gameCode, player } = socket.handshake.query;
    console.log(gameCode, player);
    // Ensure both gameCode and player are provided
    if (!gameCode || !player) {
        return socket.emit("error", "Missing game code or player information");
    }
    if (!gameRooms[gameCode]) {
        gameRooms[gameCode] = [];
    }
    // Add the player to the room
    gameRooms[gameCode].push({ player, socketId: socket.id });
    // Send a welcome message to the player
    socket.emit("message", `Welcome ${player} to the game!`);
    // Notify other players in the same game
    socket.to(gameCode).emit("game_message", {
        player: "System",
        message: `${player} has joined the game!`,
        isSystemMessage: true
    });
    socket.on("send_message", (message) => {
        console.log("Message received:", { player, message, gameCode });
        io.to(gameCode).emit("game_message", {
            player: player,
            message: message,
            timestamp: new Date()
        });
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        const index = gameRooms[gameCode].findIndex((p) => p.socketId === socket.id);
        if (index !== -1) {
            // Remove the player from the room
            gameRooms[gameCode].splice(index, 1);
        }
        // Notify other players in the game
        socket.to(gameCode).emit("game_message", {
            player: "System",
            message: `${player} has left the game.`,
            isSystemMessage: true
        });
    });
});
// Start Server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server Listening on Port ${PORT}`);
});
exports.default = { app, io };
