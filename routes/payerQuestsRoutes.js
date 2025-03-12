const express = require('express');
const router = express.Router();

const { getuseritemRateLimiter,getuseritemssRateLimiter,deleteuseritemRateLimiter} = require('../midelware/retelimit/useritemRatelimit');
const { add_player_quest,delete_player_quest,edit_player_quest,get_player_quests,get_all_player_quests } = require('../controllers/payerQuestsController');

const { verifyAccessToken,verifyRole } = require('../midelware/auth');




//? add_item
router.post("/add_player_quest",verifyAccessToken, add_player_quest);

router.delete("/delete_player_quest/:playerId/:questId",[deleteuseritemRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], delete_player_quest);

//? edit
router.patch("/edit_player_quest/:playerId/:questId",verifyAccessToken, edit_player_quest);

router.get("/:playerId",verifyAccessToken, get_player_quests);

router.get("/",[getuseritemssRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], get_all_player_quests);







module.exports = router;