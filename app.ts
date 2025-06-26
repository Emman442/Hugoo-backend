import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

import userRouter from "./src/routes/userRoutes";
import playlistRouter from "./src/routes/playlistRoutes";
import songRouter from "./src/routes/songRoutes";
import gameRouter from "./src/routes/gameRoutes";
import errorHandler from "./src/controllers/errorController";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Default to 5000 if not set
const version = "v1";

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(morgan("dev"));

// Cloudinary Setup
cloudinary.v2.config({
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
app.use(cors(corsOptions));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("✅ Database connected successfully!"))
    .catch((err) => console.error("❌ Database connection error:", err));

// Routes
app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/playlists`, playlistRouter);
app.use(`/api/${version}/song`, songRouter);
app.use(`/api/${version}/game`, gameRouter);
app.use(errorHandler);

// Create HTTP Server
const httpServer = createServer(app);

// Configure Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

interface GameQuery {
    gameCode?: string;
    player?: string;
}

interface Player {
    player: string;
    socketId: string;
    isHost: boolean;
    status: "Ready" | "Not Ready";
}

// A dictionary to hold rooms and players
const gameRooms: { [gameCode: string]: Player[] } = {};
const socketToRoom: { [socketId: string]: string } = {};

io.on("connection", (socket: Socket) => {
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

            delete socketToRoom[socket.id];  // Important to clean up old room mapping
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
        } else {
            // Add new player to the room
            const newPlayer: Player = {
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
        const hostPlayer = room?.find(p => p.isHost && p.socketId === socket.id);

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

    socket.on("send_message", (message: string) => {
        const currentRoom = socketToRoom[socket.id];
        if (!currentRoom) {
            console.log("❌ No room found for send_message");
            return;
        }

        const room = gameRooms[currentRoom];
        const sender = room?.find(p => p.socketId === socket.id);

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