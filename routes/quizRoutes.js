const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/quiz/add
// @desc    เพิ่มโจทย์ใหม่
// @access  Private (ต้องมี Token)
// routes/quizRoutes.js
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

// @route   GET api/quiz/random
// @desc    ดึงคำถามแบบสุ่ม
// @access  Private
router.get('/random', auth, async (req, res) => {
  try {
    // ดึงคำถามแบบสุ่ม 1 ข้อ
    const quiz = await Quiz.aggregate([{ $sample: { size: 1 } }]);

    if (!quiz.length) {
      return res.status(404).json({ msg: 'No quizzes found' });
    }

    res.json(quiz[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/quiz/submit
// @desc    ส่งคำตอบและอัปเดตคะแนน
// @access  Private
router.post('/submit', auth, async (req, res) => {
  const { quizId, isCorrect } = req.body;

  try {
    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!quizId || isCorrect === undefined) {
      return res.status(400).json({ msg: 'Please provide quizId and isCorrect' });
    }

    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // อัปเดตคะแนน (ถ้าตอบถูก)
    if (isCorrect) {
      user.score += 10; // เพิ่มคะแนน +10
      await user.save();
    }

    res.json({ msg: 'Answer submitted successfully', score: user.score });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;