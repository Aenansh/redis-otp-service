import { Worker } from "bullmq";
import { otpEmail } from "./utils/email.util.js";

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

const emailWorker = new Worker(
  "email_queue",
  async (job) => {
    try {
      //send email
      console.log("Processing email...", job.id, job.name, job.data);
      await otpEmail(job.data.to, job.data.otp);
      console.log("Email sent.", job.id, job.name, job.data);
    } catch (error) {
      //email error
      console.log("Error occured while sending the mail", error);
    }
  },
  {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
  },
);

const smsWorker = new Worker(
  "sms_queue",
  async (job) => {
    try {
      //send sms
    } catch (error) {
      //sms error
      console.log("Error occured while sending the sms", error);
    }
  },
  {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
  },
);
