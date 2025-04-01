import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

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

io.on("connection", (socket) => {
    console.log("🔌 Socket Connected:", socket.id);

    socket.on("hello", (data) => {
       console.log("Message Received!", data)
    });

    socket.on("disconnect", () => {
        console.log("❌ Socket Disconnected:", socket.id);
    });
});

// Start Server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server Listening on Port ${PORT}`);
});

export default {app, io};
