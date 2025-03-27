"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const playlistRoutes_1 = __importDefault(require("./src/routes/playlistRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const version = "v1";
app.use(express_1.default.json());
mongoose_1.default.connect(process.env.MONGO_URI).then((con) => console.log("Hugoo Database connected Successfully!"), err => { console.log(err); });
app.get("/", (req, res) => {
    res.send("Hello");
});
app.use(`/api/${version}/users`, userRoutes_1.default);
app.use(`/api/${version}/playlists`, playlistRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server Listening on Port ${PORT}`);
});
