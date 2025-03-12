const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoginSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // อ้างอิงไปที่ User
  deviceFingerprint: { type: String, required: true }, // บันทึก deviceFingerprint
  lastLogin: { type: Date, default: Date.now }, // เวลาที่ทำการล็อกอิน
  ipAddress: { type: String }, // IP Address ของผู้ใช้
});

const Login = mongoose.model('Login', LoginSchema);
module.exports = Login;
