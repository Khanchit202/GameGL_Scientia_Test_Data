const mongoose = require("mongoose");

// Schema สำหรับเก็บข้อมูลไอเท็มที่ผู้เล่นเป็นเจ้าของ
const PlayerItemSchema = new mongoose.Schema({
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // อ้างอิงถึงผู้เล่น
    required: true,
  },
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item", // อ้างอิงถึงไอเท็ม
    required: true,
  },
  quantity: { 
    type: Number, 
    default: 1, // จำนวนไอเท็ม
  },
  isEquipped: { 
    type: Boolean, 
    default: false, // ผู้เล่นสวมใส่ไอเท็มนี้อยู่หรือไม่
  },
  durability: { 
    type: Number, 
    default: 100, // ค่าความทนทานเริ่มต้น (ลดลงตามการใช้งาน)
  },
  condition: { 
    type: String, 
    enum: ["New", "Used", "Broken"], 
    default: "New", // สถานะของไอเท็ม
  },
  acquiredAt: { 
    type: Date, 
    default: Date.now, // วันที่ได้รับไอเท็ม
  },
  expireAt: { 
    type: Date, // วันหมดอายุของไอเท็ม (เช่น Buff)
  },
});

module.exports = mongoose.model("PlayerItem", PlayerItemSchema);