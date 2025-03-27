import axios from "axios";
import { Request, Response } from "express";
import qs from "qs"
import Playlist from "../models/playlistSchema";



export const createPlaylist = async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const newPlaylist = await Playlist.create({
        name,
        description,
    })

    res.status(200).json({
        status: "success",
        data: {
            newPlaylist
        }
    })
}