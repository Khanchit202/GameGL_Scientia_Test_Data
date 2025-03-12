const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

// @route   POST api/quiz/add
// @desc    เพิ่มโจทย์ใหม่
// @access  Private (ต้องมี Token)
router.post('/add', auth, async (req, res) => {
  const { question, options, correctAnswer } = req.body;

  try {
    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!question || !options || !correctAnswer) {
      return res.status(400).json({ msg: 'Please provide all fields' });
    }

    // ตรวจสอบว่าตัวเลือกมี 4 ตัวหรือไม่
    if (options.length !== 4) {
      return res.status(400).json({ msg: 'Options must have exactly 4 choices' });
    }

    // สร้างโจทย์ใหม่
    const quiz = new Quiz({
      question,
      options,
      correctAnswer,
    });

    // บันทึกลงฐานข้อมูล
    await quiz.save();

    res.json({ msg: 'Quiz added successfully', quiz });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;