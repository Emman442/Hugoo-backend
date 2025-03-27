import mongoose from "mongoose";


const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    images: [
        { type: String }
    ],
    image:
        { type: String, required: true },

    description: { type: String },
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song"
    }],
    mode: {
        type: String,
        default: "easy",
        enum: ["easy", "medium", "hard"]
    }

});

const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;


