"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const playlistRoutes_1 = __importDefault(require("./src/routes/playlistRoutes"));
const songRoutes_1 = __importDefault(require("./src/routes/songRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const version = "v1";
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
cloudinary_1.default.v2.config({
    cloud_name: "dighewixb",
    api_key: "999648751199222",
    api_secret: "Wlq7lsmTYKxhhvrGku4PMdVjg3I",
});
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
mongoose_1.default.connect(process.env.MONGO_URI).then((con) => console.log("Hugoo Database connected Successfully!"), err => { console.log(err); });
app.use(`/api/${version}/users`, userRoutes_1.default);
app.use(`/api/${version}/playlists`, playlistRoutes_1.default);
app.use(`/api/${version}/song`, songRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server Listening on Port ${PORT}`);
});
