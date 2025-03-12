const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const redis = require("../index");
const PlayerProgress = require("../Schemas/payerProgess");

// ✅ เพิ่มข้อมูล Player Progress
const add_payer = async (req, res) => {
  try {
    const { playerId, level, experiencePoints, currency } = req.body;

    const newProgress = new PlayerProgress({
      playerId,
      level,
      experiencePoints,
      currency,
    });

    await newProgress.save();
    res.status(201).json({ message: "Player progress added successfully", progress: newProgress });
  } catch (error) {
    res.status(500).json({ message: "Error adding player progress", error });
  }
};

// ✅ ลบข้อมูล Player Progress ตาม payerId
const delete_payer = async (req, res) => {
    try {
      const { payerId } = req.params; // ใช้ payerId จาก URL
  
      const deletedProgress = await PlayerProgress.findOneAndDelete({ playerId: payerId });
      
      if (!deletedProgress) {
        return res.status(404).json({ message: "Player progress not found" });
      }
  
      res.json({ message: "Player progress deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting player progress", error });
    }
  };
  

const edit_payer = async (req, res) => {
    try {
      const { payerId } = req.params; // ใช้ payerId จาก URL
  
      const updatedProgress = await PlayerProgress.findOneAndUpdate(
        { playerId: payerId }, // ค้นหาจาก playerId แทน _id
        req.body,
        { new: true }
      );
  
      if (!updatedProgress) {
        return res.status(404).json({ message: "Player progress not found" });
      }
  
      res.json({ message: "Player progress updated successfully", progress: updatedProgress });
    } catch (error) {
      res.status(500).json({ message: "Error updating player progress", error });
    }
  };
  
  

// ✅ ดึงข้อมูล Player Progress ตาม `payerId`
const getpayer = async (req, res) => {
  try {
    const { payerId } = req.params;

    const progress = await PlayerProgress.findOne({ playerId: payerId })
      .populate("playerId","playerId level currency "); // ดึงข้อมูล User

    if (!progress) return res.status(404).json({ message: "Player progress not found" });

    res.json({ message: "Player progress fetched successfully", progress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching player progress", error });
  }
};

const getAllPayers = async (req, res) => {
  try {
    const progressList = await PlayerProgress.find()
      .populate("playerId", "user.name user.username user.email") // ดึงข้อมูล User ที่เกี่ยวข้อง
      .exec();

    if (!progressList || progressList.length === 0) {
      return res.status(404).json({ message: "No player progress found" });
    }

    res.json({ message: "All player progress fetched successfully", progressList });
  } catch (error) {
    console.error("Error fetching all player progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { add_payer, delete_payer, edit_payer, getpayer,getAllPayers };

