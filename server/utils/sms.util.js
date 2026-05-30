import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const api_key = process.env.FAST_SMS_API_KEY;
const url = process.env.FAST_SMS_URL;

export const otpSms = async (to, otp) => {
  try {
    const payload = {
      route: "q",
      message: `Your verification code is ${otp}. Do not share this code.`,
      numbers: to,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        authorization: api_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Fast2SMS API Error:", data);
      throw new Error(data.message || "Failed to send SMS via Fast2SMS");
    }

    return data;
  } catch (error) {
    console.error("Failed to send the mail", error);
    throw new Error(error);
  }
};
