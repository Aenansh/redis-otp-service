import { Router } from "express";

//Controllers
import { sendOtp, verifyOtp } from "../controllers/otp.controllers.js";

const router = Router();

router.route("/").post(sendOtp);
router.route("/verify").post(verifyOtp);

export default router;
