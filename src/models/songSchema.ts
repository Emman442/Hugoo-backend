import mongoose from "mongoose";


const songSchema = new mongoose.Schema({
    artist: {
        type: String,
        required: true
    },
    song_name: { type: String },
    url: { type: String, required: true },
    playlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist"
    },

}, {timestamps: true});

const Song = mongoose.model("Playlist", songSchema);
export default Song;


