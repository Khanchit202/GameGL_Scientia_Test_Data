const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

// @route   GET api/quiz/random
// @desc    ดึงแบบทดสอบแบบสุ่ม
// @access  Private
router.get('/random', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.aggregate([{ $sample: { size: 1 } }]); // สุ่มแบบทดสอบ 1 ข้อ
    if (!quizzes.length) {
      return res.status(404).json({ msg: 'No quizzes found' });
    }
    res.json(quizzes[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;