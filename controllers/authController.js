const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
const bodyParser = require("body-parser");
const { OAuth2Client } = require("google-auth-library");


require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const redis = require("../index");

const sendEmail = require("../models/email/sendVerifyEmail");

const User = require("../Schemas/user");
const user = require("../Schemas/user");
const Login = require('../Schemas/userLogin');


const register = async (req, res) => {
  try {
    const { rEmail, rUsername, rPassword } = req.body;

    // ตรวจสอบว่าข้อมูลที่จำเป็นถูกส่งมาครบถ้วน
    if (!rUsername || !rEmail || !rPassword) {
      return res.status(400).send({
        status: "error",
        message: "Username, email, and password are required!",
      });
    }

    // ตรวจสอบว่ามีผู้ใช้งานที่ใช้ email นี้อยู่แล้วหรือไม่
    const existingUser = await user.findOne({ "user.email": rEmail });
    if (existingUser) {
      return res.status(400).send({
        status: "error",
        message: "Email is already in use!",
      });
    }

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(rPassword, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = new user({
      user: {
        name: rUsername,
        email: rEmail,
        password: hashedPassword,
      },
      isVerified: false, // เพิ่มสถานะว่ายังไม่ได้ยืนยันอีเมล
    });

    // บันทึกข้อมูลผู้ใช้งานในฐานข้อมูล
    const savedUser = await newUser.save();

    // 🔑 สร้าง Token สำหรับยืนยันอีเมล
    const activationToken = crypto.randomBytes(32).toString("hex");
    const refKey = crypto.randomBytes(2).toString("hex").toUpperCase();

    // 🔥 จัดเก็บ Token ลง Redis (หมดอายุใน 10 นาที)
    await redis.hSet(
      rEmail,
      {
        token: activationToken,
        ref: refKey,
      },
      { EX: 600 }
    );

    // 📧 ลิงก์ยืนยันอีเมล
    const link = `${process.env.BASE_URL}/api/accounts/verify/email?email=${rEmail}&ref=${refKey}&token=${activationToken}`;

    // 📩 ส่งอีเมลยืนยัน
    await sendEmail(rEmail, "Verify Email For Healworld.me", link);

    // ส่งคำตอบกลับไปยัง Unity หรือ Frontend
    res.status(201).send({
      status: "success",
      message: "Successfully registered! Please confirm your email address.",
    });

  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error.",
    });
  }
};

const login = async (req, res) => {
  console.log("login function");

  try {
    const { rEmail, rPassword, deviceFingerprint } = req.body; // รับ deviceFingerprint จาก request

    if (!rEmail || !rPassword) {
      return res.status(400).send({
        code: 1,
        message: "Invalid credentials",
      });
    }

    const foundUser = await User.findOne({ "user.email": rEmail });
    if (!foundUser) {
      return res.status(404).send({
        code: 1,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(rPassword, foundUser.user.password);
    if (!isMatch) {
      return res.status(401).send({
        code: 1,
        message: "Invalid credentials",
      });
    }

    // ✅ เพิ่ม role เข้าไปใน JWT Token
    const accessToken = jwt.sign(
      {
        userId: foundUser._id,
        name: foundUser.user.name,
        email: foundUser.user.email,
        role: foundUser.role, // ✅ เพิ่ม role
      },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );

    const refreshToken = jwt.sign(
      {
        userId: foundUser._id,
        name: foundUser.user.name,
        email: foundUser.user.email,
        role: foundUser.role, // ✅ เพิ่ม role
      },
      process.env.JWT_REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );

    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // ดึง IP Address

    // 🔥 อัปเดตข้อมูลการล็อกอินลง MongoDB
    try {
      await Login.findOneAndUpdate(
        { userId: foundUser._id }, // ค้นหาผู้ใช้ตาม userId
        {
          $set: {
            deviceFingerprint: deviceFingerprint || "Unknown Device",
            ipAddress: ipAddress || "Unknown IP",
            lastLogin: new Date(), // อัปเดตเวลาล็อกอิน
          },
        },
        { upsert: true } // ถ้าไม่พบข้อมูล ให้เพิ่มข้อมูลใหม่
      );
      console.log("Login record updated.");
    } catch (logError) {
      console.error("Failed to update login record:", logError);
    }

    return res.status(200).send({
      code: 0,
      message: "Login successful",
      data: {
        userId: foundUser._id,
        user: {
          name: foundUser.user.name,
          email: foundUser.user.email,
          role: foundUser.role,
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send({
      code: 2,
      message: "Internal server error",
    });
  }
};



const logout = async (req, res) => {
    try {
      // ดึง userId จาก JWT หรือข้อมูลใน body
      const userId = req.user ? req.user.userId : req.body.userId;
  
      if (!userId) {
        return res.status(400).send({
          status: 'error',
          message: 'User ID is required for logout.',
        });
      }
  
      // ลบข้อมูลที่เก็บไว้ใน Redis
      await redis.del(`Last_Access_Token_${userId}`);
      await redis.del(`Last_Refresh_Token_${userId}`);
      await redis.del(`Device_Fingerprint_${userId}`);
  
      res.status(200).send({
        status: 'success',
        message: 'Successfully logged out.',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).send({
        status: 'error',
        message: 'Internal server error.',
      });
    }
};
  

const googleCallback = async (req, res, next) => {
  res
    .status(200)
    .send({ status: "success", message: req.authInfo, user: req.user });
};


const googleFlutterLogin = async (req, res) => {
  //return res.status(200).send({ status: 'success', message: 'Line Authenticated', user: req.user })
  let macAddressRegex = new RegExp(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})|([0-9a-fA-F]{4}.[0-9a-fA-F]{4}.[0-9a-fA-F]{4})$/
  );

  if (!req.headers["mac-address"])
    return res
      .status(401)
      .send({ status: "error", message: "MAC address is required!" });

  if (!req.headers["hardware-id"])
    return res
      .status(401)
      .send({ status: "error", message: "Hardware ID is required!" });

  if (macAddressRegex.test(req.headers["mac-address"]) === false)
    return res
      .status(401)
      .send({ status: "error", message: "MAC address is invalid!" });

  const hardwareId = req.headers["hardware-id"];

  const { token } = req.body;
  console.log("token = " + token);
  console.log("CLIENT_ID = " + CLIENT_ID);
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    console.log("....... about to payload");
    const payload = ticket.getPayload();

    console.log("payload = " + JSON.stringify(payload, null, 2));

    let newUserId = uuidv4();
    let foundUser;
    let email = payload["email"];

    user.findOne({ "user.email": email }).then((existingUser) => {
      if (existingUser) {
        console.log(existingUser);
        if (existingUser.user.activated === false) {
          let activationToken = crypto.randomBytes(32).toString("hex");
          let refKey = crypto.randomBytes(2).toString("hex").toUpperCase();
          redis.hSet(
            email,
            {
              token: activationToken,
              ref: refKey,
            },
            { EX: 600 }
          );
          redis.expire(email, 600);

          const link = `${process.env.BASE_URL}/api/v1/accounts/verify/email?email=${email}&ref=${refKey}&token=${activationToken}`;

          sendEmail(email, "Verify Email For Healworld.me", link);

          //return res.status(406).send(null, false, { statusCode: 406, message: 'Email has not been activated. Email activation has been sent to your email. Please activate your email first.' })

          return res.status(406).send({
            message:
              "Email has not been activated. Email activation has been sent to your email. Please activate your email first.",
          });
        } else {
          const foundUser = existingUser;
          const foundUserEmail = foundUser.user.email;
          const foundUserId = foundUser.userId;

          //? JWT
          const accessToken = jwt.sign(
            {
              userId: foundUserId,
              name: foundUser.user.name,
              email: foundUserEmail,
            },
            process.env.JWT_ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
          );
          const refreshToken = jwt.sign(
            {
              userId: foundUserId,
              name: foundUser.user.name,
              email: foundUserEmail,
            },
            process.env.JWT_REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
          );
          redis.sAdd(`Mac_Address_${foundUserId}`, req.headers["mac-address"]);
          redis.sAdd(`Hardware_ID_${foundUserId}`, req.headers["hardware-id"]);

          //? Add Last Login Date to Redis
          redis.set(`Last_Login_${foundUserId}_${hardwareId}`, Date.now());

          //? Add Refresh Token OTP to Redis

          let length = 6,
            charset = "0123456789",
            refreshTokenOTP = "";
          for (let i = 0, n = charset.length; i < length; ++i) {
            refreshTokenOTP += charset.charAt(Math.floor(Math.random() * n));
          }

          redis.set(
            `Last_Refresh_Token_OTP_${foundUserId}_${hardwareId}`,
            refreshTokenOTP
          );
          redis.set(
            `Last_Refresh_Token_${foundUserId}_${hardwareId}`,
            refreshToken
          );
          redis.set(
            `Last_Access_Token_${foundUserId}_${hardwareId}`,
            accessToken
          );

          res.status(200).send({
            status: "success",
            message: "Successfully Login",
            data: {
              userId: foundUser._id,
              user: {
                name: foundUser.user.name,
                email: foundUserEmail,
                verified: {
                  email: foundUser.user.verified.email,
                  phone: foundUser.user.verified.phone,
                },
              },
              tokens: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                refreshTokenOTP: refreshTokenOTP,
              },
            },
          });
        }
      } else {
        

        
        new user({
          user: {
            name: payload["name"],
            email: payload["email"],
            password: uuidv4(),
          }
        })
          .save()
          .then(async (user) => {
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

            const link = `${process.env.BASE_URL}/api/v1/accounts/verify/email?email=${email}&ref=${refKey}&token=${activationToken}`;

            await sendEmail(email, "Verify Email For Healworld.me", link);

            res.status(201).send({
              status: "success",
              message: "Successfully Registered! Please confirm email address.",
              data: {
                ...user.toObject(),
                userId: user._id,
              },
            });
          })
          .catch((err) =>
            res.status(500).send({
              status: "error",
              message:
                err.message || "Some error occurred while registering user.",
            })
          );
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).send("Invalid token");
  }
};



module.exports = {
  register,
  login,
  logout,
  googleCallback,
  googleFlutterLogin,
};
