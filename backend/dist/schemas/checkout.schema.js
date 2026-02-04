"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSchema = void 0;
const zod_1 = require("zod");
exports.checkoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive(),
        description: zod_1.z.string().min(3),
        receiverId: zod_1.z.string().uuid().optional(), // Optional for some flows
    })
});
