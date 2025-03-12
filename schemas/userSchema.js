const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  score: { type: Number, default: 0 }, // เพิ่มฟิลด์ score
  date: { type: Date, default: Date.now },
});

module.exports = userSchema;