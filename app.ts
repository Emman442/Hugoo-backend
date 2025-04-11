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
    gameCode: string;
    player: string;
}



// A dictionary to hold rooms and players
const gameRooms: { [gameCode: string]: { player: string, socketId: string, isHost: boolean, status: "Ready"  }[] } = {};
const socketToRoom: { [socketId: string]: string } = {};


io.on("connection", (socket: Socket) => {
    console.log("Socket Conntected", socket.id)

    const { gameCode, player } = socket.handshake.query as unknown as GameQuery;
    console.log(gameCode, player);

    if (!gameCode || !player) {
        return socket.emit("error", "Missing game code or player information");
    }

  
    if (!gameRooms[gameCode]) {
        gameRooms[gameCode] = [];
    }
    console.log(gameRooms[gameCode].length, "gameRooms length")
    
    // Add the player to the room
    gameRooms[gameCode].push({ player, socketId: socket.id, isHost: true, status: "Ready" });
    socket.join(gameCode.toString());


    socket.on("join_game", (data) => {
        const newRoom = data.game_code.toString();

        // Leave old room if any
        const oldRoom = socketToRoom[socket.id];
        if (oldRoom && oldRoom !== newRoom) {
            socket.leave(oldRoom);

            // Remove from old room tracking
            gameRooms[oldRoom] = gameRooms[oldRoom].filter(p => p.socketId !== socket.id);

            // Broadcast update for old room
            io.to(oldRoom).emit("lobby_update", gameRooms[oldRoom]);
        }

        // Join new room
        socket.join(newRoom);
        socketToRoom[socket.id] = newRoom;

        if (!gameRooms[newRoom]) {
            gameRooms[newRoom] = [];
        }

        // Check if player is already in the room (avoid duplicates)
        const existingPlayerIndex = gameRooms[newRoom].findIndex(p => p.player === data.address);

        if (existingPlayerIndex >= 0) {
            // Update existing player's socket ID
            gameRooms[newRoom][existingPlayerIndex].socketId = socket.id;
        } else {
            // Add new player to the room
            gameRooms[newRoom].push({
                player: data.address,
                socketId: socket.id,
                status: "Ready",
                isHost: false// First player is host
            });

            // Only send join message for new players
            socket.to(newRoom).emit("game_message", {
                player: "System",
                message: `${data.address} has joined the game!`,
                isSystemMessage: true
            });
        }

        // Send updated lobby to all players in the room
        io.to(newRoom).emit("lobby_update", gameRooms[newRoom]);
    });


    socket.on("send_message", (message: string) => {
        const currentRoom = socketToRoom[socket.id];
        if (!currentRoom) return;

        console.log("Message received:", { player, message, currentRoom });

        socket.to(currentRoom).emit("game_message", {
            player: player,
            message: message,
            timestamp: new Date()
        });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        const currentRoom = socketToRoom[socket.id];
        if (currentRoom) {
            gameRooms[currentRoom] = gameRooms[currentRoom].filter(p => p.socketId !== socket.id);
            socket.to(currentRoom).emit("game_message", {
                player: "System",
                message: `${player} has left the game.`,
                isSystemMessage: true
            });
            delete socketToRoom[socket.id];
        }
    });

});
// Start Server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server Listening on Port ${PORT}`);
});

export default {app, io};
