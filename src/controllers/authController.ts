import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import generateCompoundUsername from "../utils/generateusername";

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { address } = req.body;

        if (!address) {
            res.status(400).json({
                status: "error",
                message: "Wallet address is required"
            });
            return;
        }

        const existingUser = await User.findOne({ walletAddress: address });

        if (existingUser) {
            res.status(200).json({
                status: "success",
                data: {
                    user: existingUser,
                    isNewUser: false
                }
            });
            return;
        }

        const username = await generateCompoundUsername();
        const newUser = await User.create({
            walletAddress: address,
            username,
        });

        res.status(201).json({
            status: "success",
            data: {
                user: newUser,
                isNewUser: true
            },
        });
    } catch (error) {
        next(error);
    }
};