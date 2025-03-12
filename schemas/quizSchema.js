const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true }, // คำถาม
  options: { type: [String], required: true }, // ตัวเลือก (4 ตัวเลือก)
  correctAnswer: { type: Number, required: true }, // ตัวเลือกที่ถูกต้อง (0-3)
});

module.exports = quizSchema;