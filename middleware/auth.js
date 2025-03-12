const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    req.user = user; // กำหนด req.user เป็น Mongoose Document
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = auth;