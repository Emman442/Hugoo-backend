import express, { Request, Response } from "express";
import dotenv from "dotenv"
import userRouter from "./src/routes/userRoutes"
import playlistRouter from "./src/routes/playlistRoutes";
import songRouter from "./src/routes/songRoutes"
import gameRouter from "./src/routes/gameRoutes"
import mongoose from "mongoose";
import cloudinary from "cloudinary"
import path from "path";
import morgan from "morgan";
import cors from "cors";
dotenv.config()
const app = express();
const PORT = process.env.PORT;
const version = "v1";

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     next();
// });
app.use(express.static(path.join(__dirname, "public")));


 cloudinary.v2.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(express.json());
app.use(morgan("dev"))
app.use(cors(corsOptions))

mongoose.connect(process.env.MONGO_URI as string).then((con) => console.log("Hugoo Database connected Successfully!"), err => { console.log(err) })

app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/playlists`, playlistRouter);
app.use(`/api/${version}/song`,songRouter);
app.use(`/api/${version}/game`,gameRouter);

app.listen(PORT, () => {
    console.log(`Server Listening on Port ${PORT}`);
});
