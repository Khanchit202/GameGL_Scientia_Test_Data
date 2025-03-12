const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const redis = require("../index");


const PlayerItem = require("../Schemas/playerItem");

const add_useritem = async (req, res) => {
  try {
    const { playerId, itemId, quantity } = req.body;

    // ตรวจสอบว่าไอเท็มนี้มีอยู่แล้วหรือไม่
    let playerItem = await PlayerItem.findOne({ playerId, itemId });

    if (playerItem) {
      // ถ้ามีอยู่แล้ว ให้เพิ่มจำนวนไอเท็ม
      playerItem.quantity += quantity;
    } else {
      // ถ้ายังไม่มี ให้สร้างใหม่
      playerItem = new PlayerItem({ playerId, itemId, quantity });
    }

    await playerItem.save();
    res.status(201).json({ message: "Item added to player", playerItem });
  } catch (error) {
    res.status(400).json({ message: "Error adding item", error });
  }
};

const edit_useritem = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedItem = await PlayerItem.findByIdAndUpdate(id, req.body, { new: true });
  
      if (!updatedItem) return res.status(404).json({ message: "Item not found" });
  
      res.json({ message: "Item updated successfully", playerItem: updatedItem });
    } catch (error) {
      res.status(500).json({ message: "Error updating item", error });
    }
};
  
const delete_useritem = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedItem = await PlayerItem.findByIdAndDelete(id);
  
      if (!deletedItem) return res.status(404).json({ message: "Item not found" });
  
      res.json({ message: "Item deleted successfully", deletedItem });
    } catch (error) {
      res.status(500).json({ message: "Error deleting item", error });
    }
  };

  const getUserItems = async (req, res) => {
    try {
      const { userId } = req.params; // รับค่า userId จาก params
  
      // ดึงข้อมูลไอเท็มที่ playerId ตรงกัน
      const items = await PlayerItem.find({ playerId: userId }) // ใช้ query หา playerId นี้
        .populate("itemId") // populate ข้อมูลไอเท็มจาก Item
        .populate({
          path: "playerId", 
          select: "user.name" // เลือกข้อมูลที่ต้องการจาก PlayerProgress
        });
  
      // ตรวจสอบว่าได้ข้อมูลหรือไม่
      if (items.length === 0) {
        return res.status(404).json({ message: "No items found for this player" });
      }
  
      // ตรวจสอบข้อมูล playerId ว่าถูก populate หรือไม่
      console.log("Items fetched:", items);
  
      res.json({ message: "Player items fetched successfully", items });
    } catch (error) {
      res.status(500).json({ message: "Error fetching player items", error });
    }
  };

module.exports = {
    add_useritem,
    delete_useritem,
    edit_useritem,
    getUserItems
};
