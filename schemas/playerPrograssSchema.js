const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID ของผู้ใช้
  objectId: { type: String, required: true }, // ID ของ Object
  isCompleted: { type: Boolean, default: false }, // ตรวจสอบว่า Object นี้เสร็จสิ้นแล้วหรือไม่
});

module.exports = playerProgressSchema;