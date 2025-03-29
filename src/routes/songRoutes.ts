import { Router } from "express";
import { addSongToPlaylist, fetchSongs } from "../controllers/songsController";


const router: Router = Router()

router.post("/create/:playlistId", addSongToPlaylist)
router.get("/get-songs", fetchSongs)

export default router;