const express = require('express');
const router = express.Router();


const { add_useritem,delete_useritem,edit_useritem,getUserItems } = require('../controllers/useritemController');

const { verifyAccessToken } = require('../midelware/auth');




//? add_item
router.post("/add_useritem",verifyAccessToken, add_useritem);

router.delete("/delete_useritem/:id",verifyAccessToken, delete_useritem);

//? edit
router.patch("/edit_useritem/:id",verifyAccessToken, edit_useritem);

router.get("/:userId",verifyAccessToken, getUserItems);







module.exports = router;