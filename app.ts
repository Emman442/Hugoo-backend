import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import GameRoom, { IGameRoom } from "./src/models/gameRoomSchema";
import userRouter from "./src/routes/userRoutes";
import playlistRouter from "./src/routes/playlistRoutes";
import songRouter from "./src/routes/songRoutes";
import gameRouter from "./src/routes/gameRoutes";
import errorHandler from "./src/controllers/errorController";
import { generateGameRounds } from "./src/utils/generateRounds";
import { fetchPlaylistFromDatabase } from "./src/controllers/PlaylistController";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const version = "v1";

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(morgan("dev"));

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("✅ Database connected successfully!"))
    .catch((err) => console.error("❌ Database connection error:", err));

// API Routes
app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/playlists`, playlistRouter);
app.use(`/api/${version}/song`, songRouter);
app.use(`/api/${version}/game`, gameRouter);
app.use(errorHandler);

// Socket.io Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

interface Player {
    player: string;
    socketId: string;
    isHost: boolean;
    status: "Ready" | "Not Ready";
    score: number;
}

export interface GameRound {
    roundNumber: number;
    correctSong: { song_name: string; url: string; };
    options: string[];
}

interface GameState {
    gameCode: string;
    hostPlaylistId: string;
    currentRound: number;
    totalRounds: number;
    gamePhase: 'lobby' | 'playing' | 'finished';
    rounds: GameRound[];
    playersAnswered: Set<string>;
}

const gameRooms: Record<string, Player[]> = {};
const socketToRoom: Record<string, string> = {};
const gameStates: Record<string, GameState> = {};

io.on("connection", (socket: Socket) => {
    // Fixed join_game event handler
    socket.on("join_game", async (data) => {
        const { game_code, address, isHost, playlistId } = data;
        const newRoom = game_code.toString();
        const oldRoom = socketToRoom[socket.id];

        if (oldRoom && oldRoom !== newRoom) {
            socket.leave(oldRoom);
            gameRooms[oldRoom] = gameRooms[oldRoom]?.filter(p => p.socketId !== socket.id) || [];
            io.to(oldRoom).emit("lobby_update", gameRooms[oldRoom]);
            delete socketToRoom[socket.id];
        }

        socket.join(newRoom);
        socketToRoom[socket.id] = newRoom;
        if (!gameRooms[newRoom]) gameRooms[newRoom] = [];

        const existingPlayer = gameRooms[newRoom].find(p => p.player === address);
        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            if (isHost) existingPlayer.isHost = true;
        } else {
            const newPlayer: Player = {
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
            const dbRoom = await GameRoom.findOne({ gameCode: newRoom });
            if (dbRoom) {
                gameStates[newRoom] = {
                    gameCode: dbRoom.gameCode,
                    hostPlaylistId: dbRoom.hostPlaylistId,
                    currentRound: dbRoom.currentRound,
                    totalRounds: dbRoom.totalRounds,
                    gamePhase: dbRoom.gamePhase,
                    rounds: dbRoom.rounds,
                    playersAnswered: new Set(),
                };
                console.log(`✅ Restored gameState for room ${newRoom} from DB`);
            } else {
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
        } else {
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
        await saveRoomState(newRoom);
    });

    socket.on("start_game", async (data) => {
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
            const dbRoom = await GameRoom.findOne({ gameCode: currentRoom });
            if (dbRoom) {
                gameStates[currentRoom] = {
                    gameCode: dbRoom.gameCode,
                    hostPlaylistId: dbRoom.hostPlaylistId,
                    currentRound: dbRoom.currentRound,
                    totalRounds: dbRoom.totalRounds,
                    gamePhase: dbRoom.gamePhase,
                    rounds: dbRoom.rounds,
                    playersAnswered: new Set(),
                };
                gameState = gameStates[currentRoom];
            } else {
                console.log("❌ No gameState found in memory or DB");
                return socket.emit("error", "Game state not found");
            }
        }

        // ✅ FIXED: Always ensure we have a playlistId before starting
        if (!gameState.hostPlaylistId && playlistId) {
            gameState.hostPlaylistId = playlistId;
            console.log(`✅ Set missing hostPlaylistId to ${playlistId}`);
        }

        if (!gameState.hostPlaylistId) {
            console.log("❌ No hostPlaylistId found");
            return socket.emit("error", "Playlist not found. Please select a playlist.");
        }

        if (!players || players.length < 2) {
            console.log("❌ Not enough players:", players?.length);
            return socket.emit("error", "At least 2 players required");
        }

        const isHost = players?.find(p => p.isHost && p.player === host);
        console.log("🎮 Host check:", { host, isHost: !!isHost });

        if (!isHost) {
            console.log("❌ Host verification failed");
            return socket.emit("error", "Only the host can start the game");
        }

        try {
            const playlist = await fetchPlaylistFromDatabase(gameState.hostPlaylistId);

            if (!playlist || playlist.songs.length < 4) {
                console.log("❌ Playlist validation failed:", {
                    exists: !!playlist,
                    songCount: playlist?.songs?.length
                });
                return socket.emit("error", "Playlist needs at least 4 songs");
            }

            console.log("🎮 Generating game rounds...");
            gameState.rounds = generateGameRounds(playlist.songs, 5);
            gameState.gamePhase = "playing";
            gameState.currentRound = 1;

            console.log("🎮 Saving room state...");
            await saveRoomState(currentRoom);

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

            console.log("🎮 Setting timeout for first round...");
            setTimeout(() => {
                const firstRound = gameState.rounds[0];
                console.log("🎮 Emitting first round:", firstRound.roundNumber);
                io.to(currentRoom).emit("new_round", firstRound);
            }, 2000);

        } catch (error) {
            console.error("❌ Error starting game:", error);
            socket.emit("error", "Failed to start game");
        }
    });

    socket.on("next_round", async (data) => {
        const { game_code } = data;
        const currentRoom = game_code || socketToRoom[socket.id];
        const gameState = gameStates[currentRoom];
        if (!currentRoom || !gameState) return;

        gameState.currentRound++;

        if (gameState.currentRound <= gameState.totalRounds) {
            const nextRound = gameState.rounds[gameState.currentRound - 1];
            setTimeout(() => {
                io.to(currentRoom).emit("new_round", nextRound);
            }, 2000);
        } else {
            gameState.gamePhase = 'finished';
            const finalScores = gameRooms[currentRoom].map(player => ({
                player: player.player,
                score: player.score,
                // Add other stats you need
            }));

            io.to(currentRoom).emit("game_finished", {
                message: "Game completed!",
                players: finalScores,
                timestamp: new Date()
            });
        }

        await saveRoomState(currentRoom);
    });

    socket.on("player_answer", async (data) => {
        const { game_code, round, answer, correct, score } = data;
        const currentRoom = game_code;
        const gameState = gameStates[currentRoom];
        const players = gameRooms[currentRoom];

        if (!gameState || !players) return;

        // Track this player's answer
        gameState.playersAnswered.add(socket.id);

        // Update player score
        const player = players.find(p => p.socketId === socket.id);
        if (player) player.score = score;

        // Check if all players have answered
        const activePlayers = players.length;
        if (gameState.playersAnswered.size >= activePlayers) {
            // All players answered, move to next round
            gameState.playersAnswered.clear(); // Reset for next round

            setTimeout(() => {
                if (gameState.currentRound < gameState.totalRounds) {
                    gameState.currentRound++;
                    const nextRound = gameState.rounds[gameState.currentRound - 1];
                    io.to(currentRoom).emit("new_round", nextRound);
                } else {
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

        await saveRoomState(currentRoom);
      });

    socket.on("send_message", (message: string) => {
        const currentRoom = socketToRoom[socket.id];
        const sender = gameRooms[currentRoom]?.find(p => p.socketId === socket.id);
        if (!currentRoom || !sender) return;

        io.to(currentRoom).emit("game_message", {
            player: sender.player,
            message,
            isSystemMessage: false,
            timestamp: new Date()
        });
    });
    socket.on("disconnect", async () => {
        const currentRoom = socketToRoom[socket.id];
        if (!currentRoom) return;

        const disconnectedPlayer = gameRooms[currentRoom]?.find(p => p.socketId === socket.id);
        gameRooms[currentRoom] = gameRooms[currentRoom]?.filter(p => p.socketId !== socket.id);

        if (disconnectedPlayer) {
            socket.to(currentRoom).emit("game_message", {
                player: "System",
                message: `${disconnectedPlayer.player.substring(0, 6)}...${disconnectedPlayer.player.substring(disconnectedPlayer.player.length - 4)} has left the game.`,
                isSystemMessage: true,
                timestamp: new Date()
            });
            io.to(currentRoom).emit("lobby_update", gameRooms[currentRoom]);
        }

        if (gameRooms[currentRoom]?.length === 0) {
            delete gameRooms[currentRoom];
            delete gameStates[currentRoom];
            await GameRoom.deleteOne({ gameCode: currentRoom });
            console.log(`❌ Deleted room ${currentRoom} from DB because it's now empty`);
        } else {
            await saveRoomState(currentRoom);
        }

        delete socketToRoom[socket.id];
    });


    socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
    });
});

httpServer.listen(PORT, () => {
    loadRoomsOnStartup();
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});



async function saveRoomState(roomCode: string) {
    const players = gameRooms[roomCode];
    const gameState = gameStates[roomCode];
    if (!players || !gameState) return;

    try {
        await GameRoom.findOneAndUpdate(
            { gameCode: roomCode },
            {
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
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Saved room state for ${roomCode}`);
    } catch (error) {
        console.error(`❌ Failed to save room state for ${roomCode}:`, error);
    }
}

async function loadRoomsOnStartup() {
    try {
        const rooms = await GameRoom.find({});
        rooms.forEach(room => {
            gameRooms[room.gameCode] = room.players.map(p => ({
                player: p.player,
                socketId: '',  // Will update when players reconnect
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
    } catch (error) {
        console.error("❌ Failed to load rooms from DB:", error);
    }
}
