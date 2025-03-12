const mongoose = require("mongoose");

// Schema สำหรับเก็บข้อมูลภารกิจในเกม
const QuestSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, // ชื่อภารกิจ
  },
  description: { 
    type: String, // รายละเอียดของภารกิจ
  },
  difficulty: { 
    type: String, 
    enum: ["Easy", "Normal", "Hard", "Extreme"], 
    default: "Normal" // ระดับความยากของภารกิจ
  },
  rewardCurrency: { 
    type: Number, 
    default: 0, // รางวัลเป็นเงินในเกม
  },
  rewardExperience: { 
    type: Number, 
    default: 0, // รางวัลเป็นค่าประสบการณ์
  },
  rewardItems: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item" // ลิงก์ไปยังไอเท็มที่ให้เป็นรางวัล
  }],
  requiredLevel: { 
    type: Number, 
    default: 1, // เลเวลขั้นต่ำที่ต้องมีเพื่อรับภารกิจ
  },
  status: { 
    type: String, 
    enum: ["Active", "Completed", "Failed"], 
    default: "Active" // สถานะของภารกิจ
  },
  isRepeatable: { 
    type: Boolean, 
    default: false, // ภารกิจนี้สามารถทำซ้ำได้หรือไม่
  },
});

module.exports = mongoose.model("Quest", QuestSchema);
