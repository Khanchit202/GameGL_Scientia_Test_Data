const mongoose = require('mongoose');

// Schema สำหรับจัดเก็บข้อมูลไอเท็มในเกม
const ItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, // ชื่อไอเท็ม
  },
  type: { 
    type: String, 
    enum: ['Weapon', 'Armor', 'Consumable', 'Other'], // ประเภทของไอเท็ม
    required: true,
  },
  rarity: { 
    type: String, 
    enum: ['Common', 'Rare', 'Epic', 'Legendary'], // ระดับความหายาก
    required: true,
  },
  description: { 
    type: String, // คำอธิบายไอเท็ม
  },
  price: { 
    type: Number, 
    default: 0, // ราคาไอเท็ม
  },
});

module.exports = mongoose.model('Item', ItemSchema);
