const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
const auth = require('../middleware/auth'); 

dotenv.config();

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // ตรวจสอบว่ามีผู้ใช้ที่มี username หรือ email นี้อยู่แล้วหรือไม่
    let user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
      // ถ้ามีผู้ใช้อยู่แล้ว ให้ตรวจสอบว่าซ้ำ username หรือ email
      if (user.username === username) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
      if (user.email === email) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    // สร้างผู้ใช้ใหม่
    user = new User({
      username,
      email,
      password,
    });

    // เข้ารหัส password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // บันทึกผู้ใช้ใหม่ลงในฐานข้อมูล
    await user.save();

    // สร้างและส่งกลับ JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // ตรวจสอบว่ามีการส่ง email และ password มาใน Request หรือไม่
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }
  
    try {
      let user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
  
      const payload = {
        user: {
          id: user.id,
          username: user.username,
        },
      };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, username: user.username });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

  router.post('/logout', auth, (req, res) => {
    try {
      res.json({ msg: 'Logged out successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;