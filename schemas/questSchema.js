// schemas/questSchema.js
const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  objectId: { type: String, required: true, unique: true }, // ID ของ Object ในเกม
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // ID ของแบบทดสอบ
  isCompleted: { type: Boolean, default: false }, // ภารกิจเสร็จสิ้นหรือไม่
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID ของผู้เล่น
});

module.exports = questSchema;