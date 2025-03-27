import { Router } from "express";
import { addSongToPlaylist } from "../controllers/songsController";


const router: Router = Router()

router.post("/create/:playlistId", addSongToPlaylist)

export default router;