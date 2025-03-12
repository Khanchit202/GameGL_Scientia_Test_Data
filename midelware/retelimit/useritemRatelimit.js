const rateLimit = require("express-rate-limit");
const { RedisStore } = require('rate-limit-redis'); // ตรวจสอบให้แน่ใจว่าใช้งานเวอร์ชันล่าสุด
const redis = require('../../models/database/redis'); // นำเข้า Redis Client



// Rate Limiter สำหรับ getAccount
const getuseritemRateLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (command, ...args) => redis.sendCommand([command, ...args]),
    }),
    windowMs: 10 * 60 * 1000, // 10 นาที
    max: 1000, // จำกัด 1000 requests ต่อ 10 นาที
    standardHeaders: true,
    legacyHeaders: false,
    message: "Exceeded Rate Limit, please try again in 10 minutes",
});

// Rate Limiter สำหรับ getAccounts
const getuseritemssRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 นาที
    max: 1000, // จำกัด 1000 requests ต่อ 10 นาที
    standardHeaders: true,
    legacyHeaders: false,
    message: "Exceeded Rate Limit, please try again in 10 minutes",
});

// Rate Limiter สำหรับ deleteAccount
const deleteuseritemRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 นาที
    max: 1000, // จำกัด 1000 requests ต่อ 10 นาที
    standardHeaders: true,
    legacyHeaders: false,
    message: "Exceeded Rate Limit, please try again in 10 minutes",
});

// Rate Limiter สำหรับ deleteAccounts
const deleteuseritemsRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 นาที
    max: 1000, // จำกัด 1000 requests ต่อ 10 นาที
    standardHeaders: true,
    legacyHeaders: false,
    message: "Exceeded Rate Limit, please try again in 10 minutes",
});

// ส่งออก Rate Limiters
module.exports = {
    getuseritemRateLimiter,
    getuseritemssRateLimiter,
    deleteuseritemRateLimiter,
    deleteuseritemsRateLimiter,
};
