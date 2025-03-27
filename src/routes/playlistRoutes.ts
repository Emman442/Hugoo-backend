import express, {Router} from "express"
import {createPlaylist, deletePlaylistById, getPlaylistById, getPlaylists, updatePlaylist } from "../controllers/PlaylistController";
import uploadImage from "../utils/imageUpload"

const router:Router = Router();

router.post("/create-playlist", uploadImage.single("photo"), createPlaylist)
router.get("/get-playlists", getPlaylists)
router.get("/get-playlist/:playlistId", getPlaylistById)
router.post("/update-playlist/:playlistId", uploadImage.single("photo"), updatePlaylist)
router.delete("/delete-playlist/:playlistId", deletePlaylistById)

export default router;