import { Router } from "express";

//Controllers

const router = Router();

router.route("/").post(sendOtp);
router.route("/verify").post(verifyOtp);

export default router;