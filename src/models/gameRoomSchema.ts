import mongoose, { Schema, Document } from 'mongoose';
import { Player } from '../../app';



interface GameRound {
    roundNumber: number;
    correctSong: { song_name: string; url: string; };
    options: string[];
}

export interface IGameRoom extends Document {
    gameCode: string;
    players: Player[];
    hostPlaylistId: string;
    currentRound: number;
    totalRounds: number;
    gamePhase: 'lobby' | 'playing' | 'finished';
    rounds: GameRound[];
    totalWagered: number;
}

const PlayerSchema: Schema = new Schema({
    player: String,
    isHost: Boolean,
    status: { type: String, enum: ['Ready', 'Not Ready'], default: 'Ready' },
    score: Number,
    responseTime: Number,
    totalAnswers: Number,
    totalResponseTime: Number,
    correctAnswers: Number
}, { _id: false });

const GameRoundSchema: Schema = new Schema({
    roundNumber: Number,
    correctSong: {
        song_name: String,
        url: String,
    },
    options: [String],
}, { _id: false });

const GameRoomSchema: Schema = new Schema({
    gameCode: { type: String, unique: true },
    players: [PlayerSchema],
    hostPlaylistId: String,
    currentRound: Number,
    totalRounds: Number,
    gamePhase: { type: String, enum: ['lobby', 'playing', 'finished'], default: 'lobby' },
    rounds: [GameRoundSchema],
}, { timestamps: true });

export default mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);
