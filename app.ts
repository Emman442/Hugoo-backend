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

interface Player {
    player: string;
    socketId: string;
}



interface GameQuery {
    gameCode: string;
    player: string;
}



// A dictionary to hold rooms and players
const gameRooms: { [gameCode: string]: { player: string, socketId: string }[] } = {};

io.on("connection", (socket: Socket) => {
    console.log("Socket Conntected", socket.id)

    const { gameCode, player } = socket.handshake.query as unknown as GameQuery;
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
    socket.on("send_message", (message: string) => {
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

export default {app, io};
