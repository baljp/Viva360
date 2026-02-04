"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        return res.status(400).json({ error: 'Invalid input' });
    }
};
exports.validate = validate;
