import { Router } from "express";
import { createGame, joinGame } from "../controllers/gameController";


const router = Router();

router.post("/", createGame)
router.post("/join", joinGame)

export default router;