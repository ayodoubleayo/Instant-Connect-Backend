"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayment = void 0;
const validatePayment = (amount) => {
    if (amount <= 0)
        throw new Error("Invalid amount");
};
exports.validatePayment = validatePayment;
