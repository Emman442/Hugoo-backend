import express, { Router } from "express";
import { createUser } from "../controllers/authController";


const router: Router = express.Router();


router.post("/signup", createUser)

export default router;