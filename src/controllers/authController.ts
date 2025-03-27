import { Request, Response } from "express"
import User from "../models/userModel"

export const createUser = async(req: Request, res: Response)=>{
    const {name, email } = req.body
    const newUser = await User.create({
        name,
        email,
        collaborative: true,
        public: true,

    })

    res.status(200).json({
        status: "success",
        data: {
            newUser
        }
    })
}