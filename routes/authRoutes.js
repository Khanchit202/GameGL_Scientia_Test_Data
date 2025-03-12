const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  registerRateLimiter,
  loginRateLimiter,
} = require("../midelware/retelimit/authRatelimiter");

const {
  register,
  login,
  logout,
  googleFlutterLogin,
} = require("../controllers/authController");

const {
  verifyAccessToken,
  verifyRefreshToken,
} = require("../midelware/auth");

//? Register
router.post("/register", registerRateLimiter, register);

//? Login
router.post("/login", loginRateLimiter, login);

//? Logout
router.post("/logout", loginRateLimiter, logout);







module.exports = router;
