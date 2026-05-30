import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const brevo_api_key = process.env.BREVO_API_KEY;
const brevo_api = process.env.BREVO_API;

export const otpSms = async (to, otp) => {
  try {
    const phone = "+91" + to;
    const payload = {
      type: "transactional",
      unicodeEnabled: false,
      sender: "OTP-Service",
      recipient: phone,
      content: `Your OTP is ${otp}. Please do not share this code.`,
    };

    const response = await fetch(brevo_api, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": brevo_api_key,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo API Error:", data);
      throw new Error(data.message || "Failed to send SMS via Brevo");
    }

    return data;
  } catch (error) {
    console.error("Failed to send the mail", error);
    throw new Error(error);
  }
};
