import redis from "../config/redis.config.js";
import {
  checkAttemptBlocked,
  checkGenerateBlocked,
  incrAndCheckOtpGenerated,
  setAndIncrAttempts,
  validateIdentifier,
} from "../utils/otp.util.js";
import { emailQueue, smsQueue } from "../producer.js";

const sendOtp = async (req, res) => {
  try {
    const { identifier, method } = req.body;

    const isValid = validateIdentifier(identifier, method);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: `Invalid ${method} provided.`, success: false });
    }

    const [block1, block2] = await Promise.all([
      checkGenerateBlocked(identifier),
      checkAttemptBlocked(identifier),
    ]);
    if (block1 || block2) {
      return res.status(403).json({
        message: "You are temporarily banned due to multiple requests.",
        success: false,
      });
    }

    const generated = await incrAndCheckOtpGenerated(identifier);
    if (!generated) {
      return res.status(403).json({
        message:
          "Some problem occured or your allowed otp generations exhausted.",
        success: false,
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`otp:${identifier}`, newOtp, "EX", 180);

    if (method === "email") {
      await emailQueue.add(
        "email_otp_for_user",
        {
          to: identifier,
          otp: newOtp,
        },
        {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      );
    } else {
      await smsQueue.add(
        "sms_otp_for_user",
        {
          to: identifier,
          otp: newOtp,
        },
        {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      );
    }

    res.json({ message: "OTP sent!", success: true });
  } catch (error) {
    console.log("Error in sending OTP");
    res.status(500).json({ message: "Internal Server Error.", success: false });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const isBlocked = await checkAttemptBlocked(identifier);
    if (isBlocked) {
      return res.status(403).json({
        message: "You are temporarily banned due to multiple requests.",
        success: false,
      });
    }

    if (typeof otp !== "string" || !otp.trim()) {
      return res
        .status(400)
        .json({ message: "No OTP provided.", success: false });
    }

    const isValid = /^\d{6}$/.test(otp);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Invalid OTP provided.", success: false });
    }

    const makeAttempt = await setAndIncrAttempts(identifier);
    if (!makeAttempt) {
      return res.status(403).json({
        message: "All attempts exhausted or an error occured.",
        success: false,
      });
    }

    const realOtp = await redis.get(`otp:${identifier}`);
    if (!realOtp) {
      return res.status(400).json({ message: "OTP expired.", success: false });
    }

    if (otp !== realOtp) {
      return res
        .status(400)
        .json({ message: "Incorrect OTP provided.", success: false });
    }

    await redis.del(`otp:${identifier}`);
    res.json({ message: "Correct OTP, you can enter.", success: true });
  } catch (error) {
    console.log("Error in verifying OTP");
    res.status(500).json({ message: "Internal Server Error.", success: false });
  }
};

export { sendOtp, verifyOtp };
