import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import AppError from "../utils/appError";
import { uploadFile } from "../utils/upload";

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError("No User with that ID was found", 404))
        }
        if (req.file) {
            const image = await uploadFile(req.file.path);
            user.profile_pic = image.secure_url;
        }
        if(req.body.score){
            user.global_score += req.body.score;
        }
        if(req.body.games_won){
            user.games_won += req.body.games_won;
        }
        if(req.body.name){
            user.name += req.body.name;
        }
        await user.save({validateBeforeSave: false});
     
        res.status(200).json({
            status: "success",
            message: "Profile Updated Successfully",
            data: {
                user
            }
        })
    
    } catch (error) {
        next(error)
    }
}