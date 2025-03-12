const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PlayerProgress = require('../models/PlayerProgress');
const User = require('../models/User');

// @route   POST api/object/complete
// @desc    บันทึกสถานะ Object และเพิ่มคะแนน
// @access  Private
router.post('/complete', auth, async (req, res) => {
  const { objectId } = req.body;

  try {
    // ตรวจสอบว่า Object นี้เสร็จสิ้นแล้วหรือไม่
    let progress = await PlayerProgress.findOne({ userId: req.user.id, objectId });

    if (progress) {
      return res.status(400).json({ msg: 'Object already completed' });
    }

    // บันทึกสถานะ Object
    progress = new PlayerProgress({
      userId: req.user.id,
      objectId,
      isCompleted: true,
    });

    await progress.save();

    // ดึงข้อมูลผู้ใช้ใหม่จากฐานข้อมูล
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // เพิ่มคะแนนให้ผู้ใช้ (+10 คะแนน)
    user.score += 10;
    await user.save(); // บันทึกข้อมูลผู้ใช้

    res.json({ msg: 'Object completed successfully', score: user.score });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// @route   GET api/user/score
// @desc    ดึงคะแนนทั้งหมดของผู้ใช้
// @access  Private
router.get('/score', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('score');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;