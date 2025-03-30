import { NextFunction, Request, Response } from "express";
import Game from "../models/gameSchema";
import AppError from "../utils/appError";

export const createGame = async(req: Request, res: Response, next: NextFunction)=>{
    console.log("req.body: ",req.body)
    const {game_code, host, playlist} = req.body
    console.log("Game code", game_code)
    try {
        const newGame = new Game({
            game_code,
            host,
            playlist,
            gameStatus: "not-started"
        })
        newGame.players.push(host)
        await newGame.save();
    } catch (error) {
        next(error);
    }
}

export const joinGame = async(req: Request, res: Response, next: (NextFunction))=>{
    const user_addr = req.params.address
    const {game_code} = req.body;
    const isValidGameCode = await Game.findOne({
        game_code: {$eq: game_code}
    })

    if(!isValidGameCode){
        return next(new AppError("Invalid Game Code", 401))
    }

    // const game = await Game.findByIdAndUpdate({
    //     players: {$push: }
    // })
    
}