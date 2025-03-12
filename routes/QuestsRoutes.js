const express = require('express');
const router = express.Router();

const { getuseritemRateLimiter,getuseritemssRateLimiter,deleteuseritemRateLimiter} = require('../midelware/retelimit/useritemRatelimit');
const { add_quests,delete_quests,edit_quests,get_all_quests,get_quest_by_id,delete_all_quests } = require('../controllers/questsController');

const { verifyAccessToken,verifyRole } = require('../midelware/auth');




//? add_item
router.post("/addquests",verifyAccessToken,verifyRole(["admin", "superadmin"]), add_quests);

router.delete("/delete_quests/:id",[deleteuseritemRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], delete_quests);

router.delete("/delete_quests",[deleteuseritemRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], delete_all_quests);
//? edit
router.patch("/edit_quests/:id",verifyAccessToken,verifyRole(["admin", "superadmin"]), edit_quests);

router.get("/quests", [getuseritemssRateLimiter,verifyAccessToken, verifyRole(["admin", "superadmin"])], get_all_quests);


router.get("/quests/:questId",[getuseritemRateLimiter,verifyAccessToken], get_quest_by_id);




module.exports = router;