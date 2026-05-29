import { checkBlocked, validateIdentifier } from "../utils/otp.util.js";

const sendOtp = async (req, res) => {
  try {
    const { name, identifier, method } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ message: "No name provided.", success: false });
    }

    const isValid = validateIdentifier(identifier, method);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: `Invalid ${method} provided.`, success: false });
    }

    if (checkBlocked(identifier))
      return res
        .status(403)
        .json({
          message: "You are temporarily banned due to multiple requests.",
          success: false,
        });
  } catch (error) {
    console.log("Error in sending OTP");
    res.status(500).json({ message: "Internal Server Error.", success: false });
  }
};

export { sendOtp };
