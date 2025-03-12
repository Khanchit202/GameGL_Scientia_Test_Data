// routes/questRoutes.js
const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/quest/start
// @desc    เริ่มภารกิจ (เมื่อผู้เล่นกด E)
// @access  Private
router.post('/start', auth, async (req, res) => {
  const { objectId, quizId } = req.body;

  try {
    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!objectId || !quizId) {
      return res.status(400).json({ msg: 'Please provide objectId and quizId' });
    }

    // ตรวจสอบว่าภารกิจนี้เคยทำเสร็จแล้วหรือไม่
    const existingQuest = await Quest.findOne({ userId: req.user.id, objectId });

    if (existingQuest && existingQuest.isCompleted) {
      return res.status(400).json({ msg: 'Quest already completed' });
    }

    // สร้างภารกิจใหม่
    const quest = new Quest({
      userId: req.user.id,
      objectId,
      quizId,
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
    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!objectId || selectedAnswer === undefined) {
      return res.status(400).json({ msg: 'Please provide objectId and selectedAnswer' });
    }

    // ดึงข้อมูลภารกิจ
    const quest = await Quest.findOne({ userId: req.user.id, objectId });

    if (!quest) {
      return res.status(404).json({ msg: 'Quest not found' });
    }

    // ดึงข้อมูล Quiz
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

// @route   GET api/quest/status
// @desc    ตรวจสอบสถานะภารกิจ
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const quests = await Quest.find({ userId: req.user.id });
    res.json(quests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;