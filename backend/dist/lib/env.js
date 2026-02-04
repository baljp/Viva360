"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Force load .env from the backend root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
console.log(`🌍 [ENV] Environment loaded. APP_MODE: ${process.env.APP_MODE}`);
