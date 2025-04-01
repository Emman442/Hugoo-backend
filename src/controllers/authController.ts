import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import generateCompoundUsername from "../utils/generateusername";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { address } = req.body;
        const username = await generateCompoundUsername();
        const userAlreadyExists = await User.findOne({ walletAddress: address });

        if (userAlreadyExists) {
            // Do nothing if the user already exists
            return res.status(200).json({ // send a success message even if the user exists
                status: "success",
                data: {
                    userAlreadyExists,
                }
            });
        }

        const newUser = await User.create({
            walletAddress: address,
            username,
        });

        res.status(200).json({
            status: "success",
            data: {
                newUser,
            },
        });
    } catch (error) {
        next(error);
    }
};