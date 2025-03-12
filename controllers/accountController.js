const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const redis = require("../index");

const sendVerifyEmail = require("../models/email/sendVerifyEmail");
const sendResetPasswordEmail = require("../models/email/sendResetPasswordEmail");
const sendOTP = require("../models/email/sendOTP");

const user = require("../Schemas/user");
// นำเข้าโมเดล Login
const Login = require('../Schemas/userLogin'); 



const changeName = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({ status: "error", message: "Content cannot be empty!" });
  }

  if (!req.body.name) {
    return res.status(400).send({ status: "error", message: "Name cannot be empty!" });
  }

  const userId = req.params.user;
  const newName = req.body.name;

  try {
    const updatedUser = await user.findOneAndUpdate(
      { "user.email": userId }, // ค้นหาผู้ใช้โดยใช้ email หรือ userId
      { "user.name": newName }, // อัปเดตชื่อผู้ใช้
      { useFindAndModify: false, new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({
        status: "error",
        message: `Cannot update name for user ${userId}, maybe the user was not found.`,
      });
    } else {
      await res.status(200).send({
        authenticated_user: req.user,
        status: "success",
        message: `User ${userId}'s name has been updated to ${newName}`,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: "error", message: `Error updating user ${userId}. Error: ${err}` });
  }
};
const sendOTPHandler = async (req, res) => {
  // ใช้ req.body.email แทน req.params.email
let email = req.body.email;


  try {
    // ✅ ค้นหาผู้ใช้จากฐานข้อมูล
    let findUser = await user.findOne({ "user.email": email });

    if (!findUser) {
      return res.status(404).send({
        status: "error",
        message: "User with that email does not exist. Please make sure the email is correct.",
      });
    }

    // ✅ ส่ง OTP ไปที่อีเมล
    const result = await sendOTP(email);  // เรียกใช้ sendOTP

    return res.status(200).send(result);  // ส่งผลลัพธ์กลับไปยังผู้ใช้

  } catch (err) {
    console.error("🔥 Error processing OTP:", err);
    return res.status(500).send({
      status: "error",
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
const verifyOTPHandler = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!redis.isOpen) {
      console.log("🔄 Reconnecting to Redis...");
      await redis.connect();
    }

    let savedOTP = await redis.get(`${email}-otp`);
    console.log(`🔍 OTP from Redis: ${savedOTP}`);

    if (!savedOTP) {
      console.error("❌ OTP หมดอายุหรือไม่ถูกบันทึก");
      return res.status(400).json({ code: 2, message: "OTP expired. Request a new one." });
    }

    if (savedOTP === otp) {
      await redis.del(`${email}-otp`); // ลบ OTP หลังจากใช้งาน
      console.log("✅ OTP verified and deleted");
      return res.status(200).json({ code: 0, message: "OTP verified!" });
    } else {
      console.error("❌ OTP ไม่ถูกต้อง");
      return res.status(400).json({ code: 1, message: "Invalid OTP. Please try again." });
    }
  } catch (err) {
    console.error("🔥 Error verifying OTP:", err);
    return res.status(500).json({ code: 99, message: "Server error. Please try again later." });
  }
};



const changePassword = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).send({ status: "error", message: "Content cannot be empty!" });
    }

    if (!req.body.email) {
      return res.status(400).send({ status: "error", message: "Email is required!" });
    }

    if (!req.body.password) {
      return res.status(400).send({ status: "error", message: "Password cannot be empty!" });
    }

    if (req.body.password.length < 8) {
      return res.status(400).send({ status: "error", message: "Password must be at least 8 characters long!" });
    }

    const userEmail = req.body.email;  // ✅ รับค่า email จาก body
    const rawPassword = req.body.password;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const updatedUser = await user.findOneAndUpdate(
      { "user.email": userEmail },  // ✅ ค้นหาจาก email แทน userId
      { "user.password": hashedPassword },
      { useFindAndModify: false, new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({
        status: "error",
        message: `User with email ${userEmail} not found.`,
      });
    }

    // ✅ ลบ Token การ Reset Password ใน Redis ถ้ามี
    const checkResetPassword = await redis.get(`${userEmail}-resetPassword`);
    if (checkResetPassword) {
      await redis.del(`${userEmail}-resetPassword`);
    }

    return res.status(200).send({
      authenticated_user: req.user,
      status: "success",
      message: `Password for ${userEmail} has been updated successfully!`,
    });

  } catch (error) {
    return res.status(500).send({ status: "error", message: `Error updating password: ${error.message}` });
  }
};

const changeRole = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({ status: "error", message: "Content cannot be empty!" });
  }

  if (!req.body.role) {
    return res.status(400).send({ status: "error", message: "Role cannot be empty!" });
  }

  const userId = req.params.user; // รับ user ID หรือ email จาก params
  const newRole = req.body.role; // รับ role ใหม่จาก body

  try {
    // ค้นหาและอัปเดต role ของผู้ใช้
    const updatedUser = await user.findOneAndUpdate(
      { "user.email": userId }, // ค้นหาผู้ใช้โดยใช้ email หรือ userId
      { "user.role": newRole }, // อัปเดต role ใหม่
      { useFindAndModify: false, new: true } // ใช้ค่าที่อัปเดตใหม่
    );

    if (!updatedUser) {
      return res.status(404).send({
        status: "error",
        message: `Cannot update role for user ${userId}, maybe the user was not found.`,
      });
    } else {
      return res.status(200).send({
        authenticated_user: req.user,
        status: "success",
        message: `User ${userId}'s role has been updated to ${newRole}`,
      });
    }
  } catch (err) {
    return res.status(500).send({
      status: "error",
      message: `Error updating role for user ${userId}. Error: ${err}`,
    });
  }
};

const resetPassword = async (req, res) => {
  //return res.status(200).send({ status: 'success', message: 'New password has been sent to your email address.'});
  let email = req.params.email;

  try {
    let findUser = await user.findOne({ "user.email": email });

    if (findUser) {
      let length = 8,
        charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz",
        password = "";
      for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
      }

      const newTempPassword = password;
      let hashedPassword = await bcrypt.hash(newTempPassword, 10);

      await sendResetPasswordEmail(email, "Request To Change Password For Healworld.me", newTempPassword);
      await user.updateOne({ "user.email": email }, { "user.password": hashedPassword });
      redis.set(`${email}-resetPassword`, "true");

      await res.status(200).send({ status: "success", message: "New password has been sent to your email address." });
    } else {
      await res
        .status(404)
        .send({
          status: "error",
          message: "User with that email does not exist. Please make sure the email is correct.",
        });
    }
  } catch (err) {
    console.error(err);
  }
};

const sendEmailVerification = async (req, res) => {
  let email = req.params.email;

  try {
    let findUser = await user.findOne({ "user.email": email });

    if (findUser) {
      let activationToken = crypto.randomBytes(32).toString("hex");
      let refKey = crypto.randomBytes(2).toString("hex").toUpperCase();

      await redis.hSet(
        email,
        {
          token: activationToken,
          ref: refKey,
        },
        { EX: 600 }
      );
      await redis.expire(email, 600);

      const link = `${process.env.BASE_URL}/api/accounts/verify/email?email=${email}&ref=${refKey}&token=${activationToken}`;

      await sendVerifyEmail(email, "Verify Email For Healworld.me", link);

      //const accessToken = req.headers["authorization"].replace("Bearer ", "");

      //await redis.sAdd(`Used_Access_Token_${req.user.userId}`, accessToken);

      const newAccessToken = jwt.sign(
        { userId: req.user.userId, name: req.user.name, email: req.user.email },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
      );

      redis.set(`Last_Access_Token_${req.user.userId}_${req.headers["hardware-id"]}`, newAccessToken);

      await res
        .status(200)
        .send({
          authenticated_user: req.user,
          status: "success",
          message: "Verification E-Mail Sent! Please check your mailbox.",
          token: newAccessToken,
        });

      //.catch(err => res.status(500).send({ message: err.message || 'Some error occurred while registering user.' }));
    } else {
      await res
        .status(404)
        .send({
          status: "error",
          message: "User with that is e-mail does not exist. Please make sure the e-mail is correct.",
        });
    }
  } catch (err) {
    console.error(err);
  }
};

const verifyEmail = async (req, res) => {
  try {
    let email = req.query.email;
    let ref = req.query.ref;
    let token = req.query.token;

    console.log("👉 Received email:", email);
    console.log("👉 Received ref:", ref);
    console.log("👉 Received token:", token);

    if (!email || !ref || !token) {
      return res.status(400).send({
        status: "error",
        message: "Missing required parameters (email, ref, or token).",
      });
    }

    // ค้นหา User จาก MongoDB
    let findUser = await user.findOne({ "user.email": email });

    if (!findUser) {
      console.error("❌ User not found in database!");
      return res.status(404).send({ status: "error", message: "Invalid or expired verification link." });
    }
    console.log("✅ Found user:", findUser.user.email);

    // ดึง Token จาก Redis
    let activationToken = await redis.hGetAll(email);
    console.log("📌 Redis Token Data:", activationToken);

    if (!activationToken || !activationToken.token || !activationToken.ref) {
      console.error("❌ Token not found in Redis!");
      return res.status(404).send({ status: "error", message: "Verification token expired or invalid." });
    }

    // ตรวจสอบ Token และ Ref
    if (token !== activationToken.token || ref !== activationToken.ref) {
      console.error("❌ Token mismatch! Expected:", activationToken);
      return res.status(403).send({ status: "error", message: "Invalid verification code." });
    }

    // อัปเดตสถานะการยืนยันอีเมลของ User
    await user.updateOne(
      { "user.email": email },
      { $set: { "user.activated": true, "user.verified.email": true, "user.verified.phone": true } }
    );
    console.log("✅ Email verified successfully!");

    // ลบ Token ออกจาก Redis
    await redis.del(email);
    console.log("🗑️ Token deleted from Redis");

    // Redirect ไปหน้าที่กำหนด
    res.redirect("http://localhost:3000");
  } catch (err) {
    console.error("🔥 Error during email verification:", err);
    res.status(500).send({
      status: "error",
      message: "An error occurred during email verification. Please try again later.",
    });
  }
};



const getOneAccount = async (req, res) => {
  const userId = req.params.user;

  try {
    // ค้นหาผู้ใช้ตาม userId หรือ email
    let findUser = await user.findOne({
      $or: [{ userId: userId }, { "user.email": userId }],
    });

    if (findUser) {
      // ตรวจสอบว่า req.user มีข้อมูลที่จำเป็นหรือไม่
      if (!req.user || !req.user.userId) {
        return res.status(401).send({ status: "error", message: "Invalid token: User ID not found." });
      }

      // สร้าง accessToken ใหม่
      const newAccessToken = jwt.sign(
        { userId: req.user.userId, name: req.user.name, email: req.user.email },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
      );

      // บันทึก accessToken ล่าสุดลง Redis
      await redis.set(`Last_Access_Token_${req.user.userId}_${req.headers["hardware-id"]}`, newAccessToken);

      // ส่งข้อมูลกลับ
      return res.status(200).send({
        authenticated_user: req.user,
        status: "success",
        message: `User ID ${userId} was found.`,
        data: findUser,
        token: newAccessToken,
      });
    } else {
      return res.status(404).send({ status: "error", message: `User ID ${userId} was not found.` });
    }
  } catch (err) {
    // จัดการข้อผิดพลาดที่อาจเกิดขึ้น
    return res.status(500).send({
      status: "error",
      message: err.message || `Error retrieving user ID ${userId}`,
    });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    console.log("req.user:", req.user);  // ตรวจสอบค่า req.user
    if (!req.user || !req.user.userId) {
      return res.status(404).json({
        status: "error",
        message: "User ID was not found.",
      });
    }

    const userIdFromParams = req.params.user; // ดึง userId จาก URL params
    console.log("User ID from params:", userIdFromParams); // ตรวจสอบว่าได้รับค่าหรือไม่

    // ดึงข้อมูลจากฐานข้อมูลโดยใช้ userId ที่ได้รับ
    let userData = await user.findById(userIdFromParams); // ใช้ findById ถ้าหาก `userId` เป็น MongoDB ObjectID
    if (!userData) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    let allUsersCount = await user.countDocuments();

    const newAccessToken = jwt.sign(
      { userId: req.user.userId, name: req.user.name, email: req.user.email },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );

    await redis.set(
      `Last_Access_Token_${req.user.userId}_${req.headers["hardware-id"]}`,
      newAccessToken
    );

    return res.status(200).json({
      authenticated_user: req.user,
      status: "success",
      data: { count: allUsersCount, user: userData }, // ส่งข้อมูลผู้ใช้ที่ค้นหาได้
      token: newAccessToken,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};


const { ObjectId } = require("mongoose").Types;
const deleteOneAccount = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({ status: "error", message: "Content can not be empty!" });
  }

  const userId = req.params.user;
  if (!userId) {
    return res.status(400).send({ status: "error", message: "User ID is required!" });
  }

  console.log("Deleting User ID:", userId);

  try {
    await redis.del(`${userId}-resetPassword`);
  } catch (err) {
    console.error("Redis Error:", err);
  }

  try {
    // เช็คก่อนว่ามี user ไหม
    const userData = await user.findOne({ _id: new ObjectId(userId) });
    if (!userData) {
      return res.status(404).send({ status: "error", message: `User ID ${userId} not found.` });
    }

    // ลบ User
    const deletedUser = await user.findOneAndDelete({ _id: new ObjectId(userId) });

    if (req.user.userId === userId) {
      return res.status(200).send({
        status: "success",
        message: "Your account has been deleted. Please log out.",
      });
    }

    return res.status(200).send({
      authenticated_user: req.user,
      status: "success",
      message: `User ID ${userId} was deleted successfully.`,
    });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).send({ status: "error", message: `Could not delete User ID ${userId}` });
  }
};


const deleteAllAccounts = async (req, res) => {
  // ตรวจสอบว่าผู้ใช้ที่ทำการเรียกใช้งานมีสิทธิ์
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).send({
      status: "error",
      message: "Permission denied: You do not have admin rights",
    });
  }

  try {
    // ลบผู้ใช้ทั้งหมด
    const data = await user.deleteMany({});
    
    // สร้าง access token ใหม่
    const newAccessToken = jwt.sign(
      { userId: req.user.userId, name: req.user.name, email: req.user.email },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );
    
    // บันทึก access token ใหม่ใน redis
    await redis.set(`Last_Access_Token_${req.user.userId}_${req.headers["hardware-id"]}`, newAccessToken);

    return res.status(200).send({
      authenticated_user: req.user,
      status: "success",
      message: `${data.deletedCount} Users were deleted successfully!`,
      token: newAccessToken,
    });
  } catch (err) {
    return res.status(500).send({
      status: "error",
      message: err.message || "Some error occurred while removing all users",
    });
  }
};




const getUserLoginDetails = async (req, res) => {
  try {
    // ดึงข้อมูลการ login ทั้งหมดจากฐานข้อมูลและ populate ข้อมูล userId
    const loginDetails = await Login.find().populate('userId');
    
    // ส่งข้อมูลการ login กลับไปที่ client
    res.status(200).json(loginDetails);
  } catch (error) {
    // จัดการข้อผิดพลาด
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};






module.exports = {
  changeName,
  changePassword,
  resetPassword,
  changeRole,
  sendEmailVerification,
  verifyEmail,
  getOneAccount,
  getAllAccounts,
  deleteOneAccount,
  deleteAllAccounts,
  getUserLoginDetails,
  verifyOTPHandler,
  sendOTPHandler
};
