import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    sender: { type: String },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game"
    },

}, {timestamps: true});

const Song = mongoose.model("Message", messageSchema);
export default Song;


