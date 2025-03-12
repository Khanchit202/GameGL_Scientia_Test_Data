// routes/questRoutes.js
const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/quest/start
// @desc    เริ่มภารกิจ (เมื่อผู้เล่นกด E)
// @access  Private
router.post('/start', auth, async (req, res) => {
  const { objectId, quizId } = req.body;

  try {
    // ตรวจสอบว่าภารกิจนี้เสร็จสิ้นแล้วหรือไม่
    let quest = await Quest.findOne({ objectId, userId: req.user.id });

    if (quest && quest.isCompleted) {
      return res.status(400).json({ msg: 'Quest already completed' });
    }

    // สร้างหรืออัปเดตภารกิจ
    quest = new Quest({
      objectId,
      quizId,
      userId: req.user.id,
    });

    await quest.save();
    res.json({ msg: 'Quest started', quest });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/quest/complete
// @desc    ส่งคำตอบและตรวจสอบ (เมื่อผู้เล่นตอบคำถาม)
// @access  Private
router.post('/complete', auth, async (req, res) => {
  const { objectId, selectedAnswer } = req.body;

  try {
    // ดึงข้อมูลภารกิจ
    let quest = await Quest.findOne({ objectId, userId: req.user.id });

    if (!quest) {
      return res.status(404).json({ msg: 'Quest not found' });
    }

    // ดึงข้อมูลแบบทดสอบ
    const quiz = await Quiz.findById(quest.quizId);

    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }

    // ตรวจสอบคำตอบ
    const isCorrect = quiz.correctAnswer === selectedAnswer;

    // อัปเดตสถานะภารกิจ
    quest.isCompleted = true;
    await quest.save();

    // เพิ่มคะแนนให้ผู้เล่น (ถ้าตอบถูก)
    if (isCorrect) {
      const user = await User.findById(req.user.id);
      user.score += 10;
      await user.save();
    }

    res.json({ isCorrect, msg: isCorrect ? 'Correct answer!' : 'Wrong answer!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;