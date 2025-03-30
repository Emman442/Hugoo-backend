import { Router } from "express";
import { createGame } from "../controllers/gameController";


const router = Router();


router.post("/", createGame)


export default router;