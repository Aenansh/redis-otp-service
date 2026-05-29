import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

export const otpEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"NekkoDojo Admin" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `[ACTION REQUIRED] Your OTP`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d4af37;">NekoDojo Security</h2>
          <p>Hello,</p>
          <p>Your One Time Password is <strong>${otp}</strong>.</p>
          <p>Please keep this credential secure.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send the mail", error);
    throw new Error(error);
  }
};
