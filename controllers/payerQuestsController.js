const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const redis = require("../index");
const PlayerQuest = require("../Schemas/playerQuests");

// ✅ เพิ่มภารกิจให้ผู้เล่น
const User = require("../Schemas/user");  // โหลด User Schema
const Quest = require("../Schemas/Quests ");  // โหลด Quest Schema



const add_player_quest = async (req, res) => {
  try {
      console.log("Request Body:", req.body); // 🟢 Debug เช็กค่าที่รับมา

      const { playerId, questId } = req.body;

      // 🔴 ตรวจสอบว่ามีค่า playerId และ questId ไหม
      if (!playerId || !questId) {
          return res.status(400).json({ message: "playerId and questId are required" });
      }

      // 🔴 ตรวจสอบว่า playerId มีอยู่จริงใน User ไหม
      const player = await User.findById(playerId);
      if (!player) {
          return res.status(404).json({ message: "Player not found" });
      }

      // 🔴 ตรวจสอบว่า questId มีอยู่จริงใน Quest ไหม
      const quest = await Quest.findById(questId);
      if (!quest) {
          return res.status(404).json({ message: "Quest not found" });
      }

      // 🛑 **ป้องกันการเพิ่มซ้ำ**
      const existingQuest = await PlayerQuest.findOne({ playerId, questId });
      if (existingQuest) {
          return res.status(400).json({ message: "Player already has this quest" });
      }

      // 🟢 เพิ่มข้อมูลใหม่ โดยตั้งค่า status เป็น "In Progress"
      const newPlayerQuest = new PlayerQuest({
          playerId,
          questId,
          status: "In Progress" // ✅ เปลี่ยน status เป็น "In Progress"
      });

      await newPlayerQuest.save();

      res.status(201).json({ message: "Player quest started successfully", playerQuest: newPlayerQuest });

  } catch (error) {
      res.status(500).json({ message: "Error adding player quest", error: error.message });
  }
};

  
const delete_player_quest = async (req, res) => {
  try {
      const { playerId, questId } = req.params;

      // 🔴 ตรวจสอบว่ามี playerId และ questId หรือไม่
      if (!playerId || !questId) {
          return res.status(400).json({ message: "playerId and questId are required" });
      }

      // 🛑 **ค้นหาและลบภารกิจของผู้เล่นที่ตรงกัน**
      const deletedQuest = await PlayerQuest.findOneAndDelete({ playerId, questId });

      // 🔴 ถ้าไม่พบข้อมูล ให้แจ้งว่าไม่มีภารกิจนี้
      if (!deletedQuest) {
          return res.status(404).json({ message: "Player quest not found" });
      }

      res.json({ message: "Player quest deleted successfully" });

  } catch (error) {
      res.status(500).json({ message: "Error deleting player quest", error: error.message });
  }
};

      

const edit_player_quest = async (req, res) => {
  try {
      const { playerId, questId } = req.params; // รับ playerId และ questId จาก URL
      const { status } = req.body; // รับค่า status จาก body

      if (!playerId || !questId) {
          return res.status(400).json({ message: "playerId and questId are required" });
      }

      // 🔍 อัปเดตเฉพาะข้อมูลที่ตรงกับทั้ง playerId และ questId
      const updatedQuest = await PlayerQuest.findOneAndUpdate(
          { playerId, questId }, // ค้นหาข้อมูลที่ตรงกัน
          { 
              status, 
              completedAt: status === "Completed" ? new Date() : null 
          },
          { new: true }
      );

      if (!updatedQuest) {
          return res.status(404).json({ message: "Player quest not found" });
      }

      res.json({ message: "Player quest updated successfully", playerQuest: updatedQuest });

  } catch (error) {
      console.error("❌ Error updating player quest:", error);
      res.status(500).json({ message: "Error updating player quest", error: error.message });
  }
};

      

// ✅ ดึงข้อมูลภารกิจของผู้เล่น
const get_player_quests = async (req, res) => {
        try {
          const { playerId } = req.params;
      
          const playerQuests = await PlayerQuest.find({ playerId }).populate("questId");
          if (!playerQuests.length) return res.status(404).json({ message: "No quests found for this player" });
      
          res.json({ message: "Player quests fetched successfully", playerQuests });
        } catch (error) {
          res.status(500).json({ message: "Error fetching player quests", error });
        }
      };
      
const get_all_player_quests = async (req, res) => {
        try {
          const playerQuests = await PlayerQuest.find().populate("questId"); // ดึงทุก Quest ของทุกผู้เล่น
      
          if (!playerQuests.length) {
            return res.status(404).json({ message: "No player quests found" });
          }
      
          res.json({ message: "All player quests fetched successfully", playerQuests });
        } catch (error) {
          console.error("Error fetching all player quests:", error);
          res.status(500).json({ message: "Internal server error" });
        }
};
      

module.exports = { add_player_quest, delete_player_quest, edit_player_quest, get_player_quests,get_all_player_quests };

