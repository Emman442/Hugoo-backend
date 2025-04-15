import express, { Router } from "express";
import { createUser } from "../controllers/authController";
import { getAllUsers, updateUser } from "../controllers/userController";
import uploadImage from "../utils/imageUpload";


const router: Router = express.Router();


router.post("/", createUser)
router.get("/", getAllUsers)
router.post("/update-user/:address", uploadImage.single("photo") ,updateUser)

export default router;  