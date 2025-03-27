import express, {Router} from "express"
import {createPlaylist } from "../controllers/PlaylistController";

const router:Router = Router();

router.post("/create-playlist", createPlaylist)

export default router;