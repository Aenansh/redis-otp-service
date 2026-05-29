import redis from "../config/redis.config.js";

const maxAttemptsAmount = process.env.ATTEMPTS_ALLOWED || 5;
const maxGenerations = process.env.GENERATIONS_ALLOWED || 3;

//Validations
function validateIdentifier(identifier, method) {
  if (typeof identifier !== "string" || !identifier.trim()) return false;
  if (method === "email") {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(identifier);
  } else if (method === "phone") {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(identifier);
  }
  return false;
}

//Keys
function otpAttemptBlockedKey(identifier) {
  return `otp:${identifier}:blocked:attempts`;
}

function otpGenerateBlockedKey(identifier) {
  return `otp:${identifier}:blocked:generated`;
}

function attemptsKey(identifier) {
  return `otp:${identifier}:attempts`;
}

function generatedOtpKey(identifier) {
  return `otp:${identifier}:generated`;
}

//Redis checks
//Blocked checks
async function checkAttemptBlocked(identifier) {
  try {
    const key = otpAttemptBlockedKey(identifier);
    const isBlocked = await redis.exists(key);
    return isBlocked;
  } catch (error) {
    console.log("Error in checking blocked", error);
    return false;
  }
}

async function checkGenerateBlocked(identifier) {
  try {
    const key = otpGenerateBlockedKey(identifier);
    const isBlocked = await redis.exists(key);
    return isBlocked;
  } catch (error) {
    console.log("Error in checking blocked", error);
    return false;
  }
}

//increment attempts and generations
async function incrAndCheckOtpGenerated(identifier) {
  try {
    const generatedKey = generatedOtpKey(identifier);
    const generated = await redis.incr(generatedKey);

    if (generated === 1) await redis.expire(generatedKey, 3600);

    if (generated > maxGenerations) {
      await redis.set(otpGenerateBlockedKey(identifier), true, "EX", 3600);
      return false;
    }
    return true;
  } catch (error) {
    console.log("Error in making new OTP generation", error);
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
      await redis.set(otpAttemptBlockedKey(identifier), true);
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
  checkAttemptBlocked,
  checkGenerateBlocked,
  incrAndCheckOtpGenerated,
  setAndIncrAttempts,
};
