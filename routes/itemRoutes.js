const express = require('express');
const router = express.Router();

const { getuseritemRateLimiter,getuseritemssRateLimiter,deleteuseritemRateLimiter} = require('../midelware/retelimit/useritemRatelimit');
const { add_item,delete_item,delete_all_items,edit_item,get_all_items,get_item_by_id } = require('../controllers/itemController');

const { verifyAccessToken,verifyRole } = require('../midelware/auth');




//? add_item
router.post("/additem",verifyAccessToken,verifyRole(["admin", "superadmin"]), add_item);

router.delete("/deleteitem/:id",[deleteuseritemRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], delete_item);

router.delete("/deleteitem",[deleteuseritemRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], delete_all_items);

//? edit
router.patch("/edit_item/:id",verifyAccessToken, edit_item,verifyRole(["admin", "superadmin"]));

router.get("/items",[getuseritemssRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], get_all_items);

router.get("/items/:itemId",[getuseritemRateLimiter,verifyAccessToken], get_item_by_id);






module.exports = router;