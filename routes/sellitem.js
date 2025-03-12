// routes/sellItemRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../midelware/auth');

// นำเข้า controller สำหรับการขายไอเทม
const { sellItem } = require('../controllers/sellitemController');

// API สำหรับขายไอเทม
router.post("/sellitem", verifyAccessToken, sellItem);

module.exports = router;
