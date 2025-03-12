const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID ของผู้เล่น
  objectId: { type: String, required: true }, // ID ของ Object ในเกม
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // ID ของ Quiz
  isCompleted: { type: Boolean, default: false }, // สถานะการเสร็จสิ้นภารกิจ
  createdAt: { type: Date, default: Date.now }, // เวลาที่สร้างภารกิจ
});

module.exports = questSchema;