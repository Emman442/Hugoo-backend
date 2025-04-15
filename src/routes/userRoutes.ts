import express, { Router } from "express";
import { createUser } from "../controllers/authController";
import { updateUser } from "../controllers/userController";


const router: Router = express.Router();


router.post("/", createUser)
router.post("/update-user/:userId", updateUser)

export default router;  