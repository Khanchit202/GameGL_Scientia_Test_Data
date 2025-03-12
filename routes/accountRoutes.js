const express = require('express');
const router = express.Router();

//test update gitlab
const { getAccountRateLimiter, getAccountsRateLimiter, deleteAccountRateLimiter, deleteAccountsRateLimiter } = require('../midelware/retelimit/accountRatelimiter');

const { changeName,changePassword, resetPassword,changeRole,sendEmailVerification,getUserLoginDetails,verifyOTPHandler,sendOTPHandler, verifyEmail, getOneAccount, getAllAccounts, deleteOneAccount, deleteAllAccounts } = require('../controllers/accountController');

const { verifyAccessToken,verifyRole } = require('../midelware/auth');


//? Change Name
router.patch("/name/change/:user", changeName);
//? Change Password
router.patch("/password/change", changePassword);


//? Reset Password
router.post("/password/reset/:email", resetPassword);

router.post("/verification/email/:email", verifyAccessToken, sendEmailVerification);
//? Verify Email
router.get("/verify/email", verifyEmail);

//? Verify otp
router.post("/verify/OTP", verifyOTPHandler);

router.post("/verify/sendOTP", sendOTPHandler);
//? Get One Account
router.get("/:user", [getAccountRateLimiter],verifyAccessToken, getOneAccount);

router.get("/getuser/:user", [getAccountsRateLimiter, verifyAccessToken,verifyRole(["admin", "superadmin"])], getAllAccounts);

router.delete("/delte/:user", [deleteAccountRateLimiter, verifyAccessToken,verifyRole(["admin", "superadmin"])], deleteOneAccount);

router.delete("/", [deleteAccountsRateLimiter, verifyAccessToken,verifyRole(["admin", "superadmin"])], deleteAllAccounts);

router.patch("/role/change/:user",verifyAccessToken, changeRole,verifyRole(["admin", "superadmin"]));

router.get("/getuser/login",verifyAccessToken, getUserLoginDetails,verifyRole(["admin", "superadmin"]));


module.exports = router;