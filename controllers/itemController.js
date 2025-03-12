const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const redis = require("../index");


const Item = require("../Schemas/Items");

const add_item = async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json({ message: "Item added successfully", item: newItem });
  } catch (error) {
    res.status(400).json({ message: "Error adding item", error });
  }
};



const edit_item = async (req, res) => {
  try {
    const { id } = req.params; // ใช้ req.params.id แทน req.body.id
    const updateData = req.body;

    // ตรวจสอบว่ามี ID ถูกส่งมาหรือไม่
    if (!id) return res.status(400).json({ message: "Item ID is required" });

    // ตรวจสอบว่ามีข้อมูลให้อัปเดตหรือไม่
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    // อัปเดตข้อมูล
    const updatedItem = await Item.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedItem) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: "Error updating item", error });
  }
};




const delete_item = async (req, res) => {
  try {
    const { id } = req.params; // รับค่า id จาก URL params

    // ตรวจสอบว่ามี ID ถูกส่งมาหรือไม่
    if (!id) return res.status(400).json({ message: "Item ID is required" });

    // ค้นหาและลบไอเท็ม
    const deletedItem = await Item.findByIdAndDelete(id);

    // ถ้าไม่พบไอเท็ม
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item deleted successfully", item: deletedItem });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error });
  }
};

const delete_all_items = async (req, res) => {
  try {
    // ลบไอเท็มทั้งหมดในฐานข้อมูล
    const result = await Item.deleteMany({});

    // ตรวจสอบว่ามีไอเท็มถูกลบหรือไม่
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No items found to delete" });
    }

    res.json({ message: "All items deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Error deleting items", error });
  }
};

const get_all_items = async (req, res) => {
    try {
      const items = await Item.find(); // ดึงไอเท็มทั้งหมดจากฐานข้อมูล
      res.json({ message: "Items fetched successfully", items });
    } catch (error) {
      res.status(500).json({ message: "Error fetching items", error });
    }
  };
  

  const get_item_by_id = async (req, res) => {
    try {
      const { itemId } = req.params; // รับค่า itemId จากพารามิเตอร์ URL
      const item = await Item.findById(itemId); // ค้นหาไอเท็มตาม ID
  
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
  
      res.json({ message: "Item fetched successfully", item });
    } catch (error) {
      res.status(500).json({ message: "Error fetching item", error });
    }
  };
  

module.exports = {
    add_item,
    delete_item,
    edit_item,
    get_all_items,
    get_item_by_id,
    delete_all_items
};
