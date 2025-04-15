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
exports.createUser = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const generateusername_1 = __importDefault(require("../utils/generateusername"));
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { address } = req.body;
        if (!address) {
            res.status(400).json({
                status: "error",
                message: "Wallet address is required"
            });
            return;
        }
        const existingUser = yield userModel_1.default.findOne({ walletAddress: address });
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
        const username = yield (0, generateusername_1.default)();
        const newUser = yield userModel_1.default.create({
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
    }
    catch (error) {
        next(error);
    }
});
exports.createUser = createUser;
