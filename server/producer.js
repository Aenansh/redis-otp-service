import { Queue } from "bullmq";

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

const emailQueue = new Queue("email_queue", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

const smsQueue = new Queue("sms_queue", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

export { emailQueue, smsQueue };
