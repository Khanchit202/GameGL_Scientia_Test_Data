const express = require('express');
const router = express.Router();

const { getuseritemRateLimiter,getuseritemssRateLimiter,deleteuseritemRateLimiter} = require('../midelware/retelimit/useritemRatelimit');
const { add_payer,delete_payer,edit_payer,getpayer,getAllPayers } = require('../controllers/payerProgessController');

const { verifyAccessToken,verifyRole } = require('../midelware/auth');




//? add_item
router.post("/add_payer",verifyAccessToken, add_payer);

router.delete("/delete_payer/:payerId",[deleteuseritemRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], delete_payer);

//? edit
router.patch("/edit_payer/:payerId",verifyAccessToken, edit_payer);

router.get("/:payerId",verifyAccessToken, getpayer);

router.get("/",[getuseritemssRateLimiter,verifyAccessToken,verifyRole(["admin", "superadmin"])], getAllPayers);







module.exports = router;