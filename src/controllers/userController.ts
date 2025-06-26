import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import AppError from "../utils/appError";
import { uploadFile } from "../utils/upload";

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { address } = req.params;
        const user = await User.findOne({walletAddress: address});
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
        if(req.body.won === true){
            user.games_won += 1;
        }
        if(req.body.name){
            user.name += req.body.name;
        }
        await user.save({validateBeforeSave: false});
     
        res.status(200).json({
            status: "success",
            message: "User Details Updated Successfully",
            data: {
                user
            }
        })
    
    } catch (error) {
        next(error)
    }
}

export const getAllUsers = async(req: Request, res: Response, next: NextFunction) => {             
    try {
        const users = await User.find({}).select("-__v -createdAt -updatedAt")
        res.status(200).json({
            status: "success",
            data: {
                users
            }
        })
    }catch (error) {        
        next(error)
    }
}