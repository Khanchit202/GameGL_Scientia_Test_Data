const mongoose = require('mongoose');

// Schema สำหรับเก็บสถานะภารกิจของผู้เล่น
const PlayerQuestSchema = new mongoose.Schema({
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // อ้างอิงถึงผู้เล่น
    required: true,
  },
  questId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quest', // อ้างอิงถึงภารกิจ
    required: true,
  },
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Completed'], // สถานะของภารกิจ
    default: 'Not Started',
  },
  startedAt: { 
    type: Date, 
    default: Date.now, // วันที่เริ่มภารกิจ
  },
  completedAt: { 
    type: Date, // วันที่ทำภารกิจเสร็จ
  },
});

module.exports = mongoose.model('PlayerQuest', PlayerQuestSchema);
