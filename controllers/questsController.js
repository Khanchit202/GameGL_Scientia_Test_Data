const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const redis = require("../index");

const Quest = require("../Schemas/Quests ");

const add_quests = async (req, res) => {
  try {
    const newQuest = new Quest(req.body);
    await newQuest.save();
    res.status(201).json({ message: "Quest added successfully", quest: newQuest });
  } catch (error) {
    res.status(400).json({ message: "Error adding quest", error });
  }
};

const edit_quests = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedQuest = await Quest.findByIdAndUpdate(id, req.body, { new: true });
  
      if (!updatedQuest) return res.status(404).json({ message: "Quest not found" });
  
      res.json({ message: "Quest updated successfully", quest: updatedQuest });
    } catch (error) {
      res.status(500).json({ message: "Error updating quest", error });
    }
  };
  

const delete_quests = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedQuest = await Quest.findByIdAndDelete(id);
  
      if (!deletedQuest) return res.status(404).json({ message: "Quest not found" });
  
      res.json({ message: "Quest deleted successfully", quest: deletedQuest });
    } catch (error) {
      res.status(500).json({ message: "Error deleting quest", error });
    }
  };

  const delete_all_quests = async (req, res) => {
    try {
        const result = await Quest.deleteMany({}); // ลบทุกเอกสารในคอลเลกชัน Quest

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No quests found to delete" });
        }

        res.json({ message: "All quests deleted successfully", deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: "Error deleting quests", error });
    }
};


const get_all_quests = async (req, res) => {
    try {
      const quests = await Quest.find();
      res.json({ message: "Quests fetched successfully", quests });
    } catch (error) {
      res.status(500).json({ message: "Error fetching quests", error });
    }
  };

const get_quest_by_id = async (req, res) => {
    try {
      const { questId } = req.params; // รับค่า questId จากพารามิเตอร์ URL
      const quest = await Quest.findById(questId); // ค้นหา Quest ตาม ID
  
      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
  
      res.json({ message: "Quest fetched successfully", quest });
    } catch (error) {
      res.status(500).json({ message: "Error fetching quest", error });
    }
  };
  
  

module.exports = {
    add_quests,
    delete_quests,
    edit_quests,
    get_all_quests,
    get_quest_by_id,
    delete_all_quests
};
