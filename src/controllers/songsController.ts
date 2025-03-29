import { NextFunction, Request, Response } from "express";
import Song from "../models/songSchema";
import Playlist from "../models/playlistSchema";
import AppError from "../utils/appError";

export const addSongToPlaylist = async(req:Request, res: Response, next: NextFunction)=>{
    try {
        const playlist = await Playlist.findById(req.params.playlistId)
        if(!playlist){
            return next(new AppError("Playlist with that ID Not Found", 404))
        }
        const newSong = await Song.create({
            artist: req.body.artist,
            song_name: req.body.song_name,
            url: req.body.url,
            playlist: req.params.playlistId
        })
    
        playlist.songs.push(newSong._id);
        await playlist.save();
        res.status(200).json({
            status: "success",
            data: {
                newSong
            }
        })
    } catch (error) {
        next(error)
    }
}
export const fetchSongs = async(req:Request, res: Response, next: NextFunction)=>{
    try {
        const songs = await Song.find({}).populate("playlists")
      
    
        res.status(200).json({
            status: "success",
            data: {
                songs
            }
        })
    } catch (error) {
        next(error)
    }
}