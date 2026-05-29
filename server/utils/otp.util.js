import redis from "../config/redis.config.js"

export function validateIdentifier(identifier, method) {
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

export function otpBlockedKey(identifier) {
  return `otp:${identifier}:blocked`;
}

export function checkBlocked(identifier) {
  const key = otpBlockedKey(identifier);
  const isBlocked = await redis.exists(key);
  return isBlocked;
}