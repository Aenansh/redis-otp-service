import { Worker } from "bullmq";

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

const emailWorker = new Worker(
  "email_queue",
  async (job) => {
    try {
      //send email
    } catch (error) {
      //email error
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
    }
  },
  {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
  },
);
