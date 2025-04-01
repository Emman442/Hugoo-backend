import {Server} from "socket.io"

import app from "../../app"
import { createServer } from "http";

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });
console.log("heyy")
io.on("connection", (socket) => {
    console.log("This Socket connected!", socket.id)
});
