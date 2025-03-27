import express, { Request, Response } from "express";
import dotenv from "dotenv"
import userRouter from "./src/routes/userRoutes"
import playlistRouter from "./src/routes/playlistRoutes";
import mongoose from "mongoose";
dotenv.config()
const app = express();
const PORT = process.env.PORT;
const version = "v1";

app.use(express.json());


mongoose.connect(process.env.MONGO_URI as string).then((con) => console.log("Hugoo Database connected Successfully!"), err => { console.log(err) })




app.get("/", (req: Request, res: Response) => {
    res.send("Hello")
})



app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/playlists`, playlistRouter);
app.listen(PORT, () => {
    console.log(`Server Listening on Port ${PORT}`);
});
