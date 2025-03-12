const mongoose = require('mongoose');

// Schema สำหรับจัดเก็บความคืบหน้าของผู้เล่น
const PlayerProgressSchema = new mongoose.Schema({
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  level: { 
    type: Number, 
    default: 1, // เลเวลเริ่มต้นของผู้เล่น
  },
  experiencePoints: { 
    type: Number, 
    default: 0, // ค่าประสบการณ์สะสม
  },
  currency: { 
    type: Number, 
    default: 0, // จำนวนเงินในเกมของผู้เล่น
  },
});

module.exports = mongoose.model('PlayerProgress', PlayerProgressSchema);
