import express, { Request, Response } from "express";
import dotenv from "dotenv"
import userRouter from "./src/routes/userRoutes"
import playlistRouter from "./src/routes/playlistRoutes";
import songRouter from "./src/routes/songRoutes"
import mongoose from "mongoose";
import cloudinary from "cloudinary"
import path from "path";
import morgan from "morgan";
import cors from "cors";
dotenv.config()
const app = express();
const PORT = process.env.PORT;
const version = "v1";

app.use(express.static(path.join(__dirname, "public")));


 cloudinary.v2.config({
    cloud_name: "dighewixb",
    api_key: "999648751199222",
    api_secret: "Wlq7lsmTYKxhhvrGku4PMdVjg3I",
});


app.use(express.json());
app.use(morgan("dev"))
app.use(cors())

mongoose.connect(process.env.MONGO_URI as string).then((con) => console.log("Hugoo Database connected Successfully!"), err => { console.log(err) })

app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/playlists`, playlistRouter);
app.use(`/api/${version}/song`,songRouter);

app.listen(PORT, () => {
    console.log(`Server Listening on Port ${PORT}`);
});
