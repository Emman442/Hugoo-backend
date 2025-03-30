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
const gameRoutes_1 = __importDefault(require("./src/routes/gameRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const version = "v1";
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     next();
// });
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)(corsOptions));
mongoose_1.default.connect(process.env.MONGO_URI).then((con) => console.log("Hugoo Database connected Successfully!"), err => { console.log(err); });
app.use(`/api/${version}/users`, userRoutes_1.default);
app.use(`/api/${version}/playlists`, playlistRoutes_1.default);
app.use(`/api/${version}/song`, songRoutes_1.default);
app.use(`/api/${version}/game`, gameRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server Listening on Port ${PORT}`);
});
