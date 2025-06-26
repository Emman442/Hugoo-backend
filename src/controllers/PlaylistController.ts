import axios from "axios";
import { NextFunction, Request, Response } from "express";
import qs from "qs"
import Playlist from "../models/playlistSchema";
import { uploadFile } from "../utils/upload";
import AppError from "../utils/appError";
import Song from "../models/songSchema";


export const createPlaylist = async (req: Request, res: Response) => {
    const { name, description, mode } = req.body;

    const image = await uploadFile(req.file?.path)

    const newPlaylist = await Playlist.create({
        name,
        description,
        image: image?.secure_url,
        mode
    })

    res.status(200).json({
        status: "success",
        data: {
            newPlaylist
        }
    })
}

export const getPlaylists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filter } = req.query;

        let sortOptions = {}; 

        if (filter === "updated-recently") {
            sortOptions = { updatedAt: -1 }; 
        } else if (filter === "added-recently") {
            sortOptions = { createdAt: -1 }; 
        }

        const playlists = await Playlist.find({})
            .sort(sortOptions)
            .populate({
                path: "songs",
                select: "artist song_name url",
            });

        res.status(200).json({
            status: "success",
            data: { playlists },
        });
    } catch (error) {
        next(error);
    }
};


export const getPlaylistById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const playlistId = req.params.playlistId;
        const playlist = await Playlist.findById(playlistId).populate("songs");

        if (!playlist) {
            return next(new AppError("No Playlist with that ID was found!", 404));
        }

        res.status(200).json({
            status: "success",
            data: { playlist },
        });
    } catch (error) {
        next(error);
    }
};
export const deletePlaylistById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const playlistId = req.params.playlistId;
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return next(new AppError("No Playlist with that ID was found!", 404));
        }

        await Playlist.findByIdAndDelete(playlistId)
        res.status(200).json({
            status: "success",
            data: null
        });
    } catch (error) {
        next(error);
    }
};


export const updatePlaylist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { playlistId } = req.params;
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return next(new AppError("No Playlist with that ID was found", 404));
        }
        if (req.file) {
            const image = await uploadFile(req.file.path);
            playlist.image = image.secure_url;
        }
        if (req.body.name) {
            playlist.name = req.body.name;
        }
        if (req.body.description) {
            playlist.description = req.body.description;
        }
        await playlist.save({ validateBeforeSave: false });

        res.status(200).json({
            status: "success",
            data: { playlist },
        });
    } catch (error) {
        next(error);
    }
};

