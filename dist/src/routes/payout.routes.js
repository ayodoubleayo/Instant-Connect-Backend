"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payout_controller_1 = require("../controllers/payout.controller");
const router = (0, express_1.Router)();
/* ======================================================
   USER PAYOUT
====================================================== */
router.post("/payout", auth_middleware_1.authMiddleware, payout_controller_1.submitPayout);
exports.default = router;
