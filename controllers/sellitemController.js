// controllers/itemController.js
const PlayerItem = require('../Schemas/playerItem');
const PlayerProgress = require('../Schemas/payerProgess');
const Item = require('../Schemas/Items');

// ฟังก์ชันขายไอเทม
const sellItem = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;

    if (!userId || !itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // ค้นหาไอเท็มที่ผู้เล่นมี
    const playerItem = await PlayerItem.findOne({ playerId: userId, itemId });

    if (!playerItem || playerItem.quantity < quantity) {
      return res.status(400).json({ message: "Not enough items to sell" });
    }

    // ดึงข้อมูลราคาขายของไอเท็ม
    const itemData = await Item.findById(itemId);
    if (!itemData) {
      return res.status(404).json({ message: "Item not found" });
    }

    const sellPrice = itemData.price * quantity; 

    // อัปเดตหรือถอนไอเท็ม
    if (playerItem.quantity === quantity) {
      await PlayerItem.deleteOne({ _id: playerItem._id }); // ลบออกถ้าขายหมด
    } else {
      playerItem.quantity -= quantity;
      await playerItem.save();
    }

    // เพิ่มเงินให้กับผู้เล่น
    const playerProgress = await PlayerProgress.findOne({ playerId: userId });
    if (!playerProgress) {
      return res.status(404).json({ message: "Player not found" });
    }

    playerProgress.currency += sellPrice;
    await playerProgress.save();

    return res.status(200).json({
      message: "Item sold successfully",
      sellPrice,
      newCurrency: playerProgress.currency,
    });
  } catch (error) {
    console.error("Error selling item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { sellItem };
