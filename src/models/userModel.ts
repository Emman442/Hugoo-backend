import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: [true, "Please provide a name"]
    },
    email: {
        type: String,
        // unique: true
    },
    level: {
        type: Number,
        default: 0
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true
    },
    games_won: {
        type: Number,
        default: 0
    },
    username: {
        type: String,
        required: true
    },
    country: {
        type: String,
    },
    total_wagered: {
        type: String
    }
}, {timestamps: true})


const User = mongoose.model("User", userSchema);
export default User;