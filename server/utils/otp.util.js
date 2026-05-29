import redis from "../config/redis.config.js";

const maxAttemptsAmount = process.env.ATTEMPTS_ALLOWED || 5;

function validateIdentifier(identifier, method) {
  if (typeof identifier !== "string" || identifier.trim()) return false;
  if (method === "email") {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(identifier);
  } else if (method === "phone") {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(identifier);
  }
  return false;
}

function otpBlockedKey(identifier) {
  return `otp:${identifier}:blocked`;
}

function attemptsKey(identifier) {
  return `otp:${identifier}:attempts`;
}

async function checkBlocked(identifier) {
  try {
    const key = otpBlockedKey(identifier);
    const isBlocked = await redis.exists(key);
    return isBlocked;
  } catch (error) {
    console.log("Error in checking blocked", error);
    return false;
  }
}

async function setAndIncrAttempts(identifier) {
  try {
    const attemptKey = attemptsKey(identifier);

    const attempts = await redis.incr(attemptKey);

    if (attempts === 1) {
      await redis.expire(attemptKey, 3600);
    } else if (attempts > maxAttemptsAmount) {
      await redis.set(otpBlockedKey(identifier), true);
      return false;
    }
    return true;
  } catch (error) {
    console.log("Error in setting attempts", error);
    return false;
  }
}

export {
  validateIdentifier,
  otpBlockedKey,
  attemptsKey,
  checkBlocked,
  setAndIncrAttempts,
};
