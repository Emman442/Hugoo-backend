"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const appError_1 = __importDefault(require("../utils/appError"));
const upload_1 = require("../utils/upload");
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            return next(new appError_1.default("No User with that ID was found", 404));
        }
        if (req.file) {
            const image = yield (0, upload_1.uploadFile)(req.file.path);
            user.profile_pic = image.secure_url;
        }
        if (req.body.score) {
            user.global_score += req.body.score;
        }
        if (req.body.games_won) {
            user.games_won += req.body.games_won;
        }
        if (req.body.name) {
            user.name += req.body.name;
        }
        yield user.save({ validateBeforeSave: false });
        res.status(200).json({
            status: "success",
            message: "Profile Updated Successfully",
            data: {
                user
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUser = updateUser;
