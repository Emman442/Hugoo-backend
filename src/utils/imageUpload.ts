import multer, { StorageEngine, FileFilterCallback } from "multer";
import { Request } from "express";
import AppError from "./appError";

// Define file storage configuration
const multerStorage: StorageEngine = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        let folder = "public/files";
        if (file.mimetype.startsWith("image")) {
            folder = "public/photos";
        }
        cb(null, folder);
    },

    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `admin-${file.fieldname}-${Date.now()}.${ext}`);
    },
});

// Define file filter configuration with correct callback type
const multerFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedImageTypes = ["image/jpeg", "image/png"];
    const allowedFileTypes = ["application/pdf"];

    const isValidImage = allowedImageTypes.includes(file.mimetype);
    const isValidPDF = allowedFileTypes.includes(file.mimetype);

    if (isValidImage || isValidPDF) {
        cb(null, true);
    } else {
        cb(new AppError("Invalid file type. Only image files or PDF formats are allowed.", 400));
    }
};

// Multer instance with limits
const uploadImage = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
        files: 5,
    },
});

export default uploadImage;
