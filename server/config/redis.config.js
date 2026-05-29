import Redis from "ioredis";

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URI = process.env.REDIS_URI || "redis://localhost:";

const redis = new Redis(REDIS_URI + REDIS_PORT);

export default redis;
