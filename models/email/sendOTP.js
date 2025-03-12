const nodemailer = require("nodemailer");
const redis = require("../database/redis");

const sendOTP = async (email) => {
  try {
    if (!redis.isOpen) {
      console.log("🔄 Reconnecting to Redis...");
      await redis.connect();
    }

    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`👉 OTP for ${email}: ${otp}`);

    // ✅ บันทึก OTP ลง Redis (หมดอายุใน 5 นาที)
    await redis.set(`${email}-otp`, otp, { EX: 300 });

    // ✅ ตรวจสอบว่า Redis เก็บค่าได้จริง
    const savedOTP = await redis.get(`${email}-otp`);
    if (!savedOTP) {
      console.error("❌ OTP ไม่ถูกบันทึกใน Redis");
      return { status: "error", message: "Failed to save OTP. Please try again." };
    }

    console.log(`✅ OTP stored in Redis: ${savedOTP}`);

    // ✅ ตั้งค่า Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // ✅ ตรวจสอบการเชื่อมต่อ SMTP
    await transporter.verify();

    // ✅ สร้าง HTML สำหรับอีเมล OTP
    let mailOptions = {
      from: `Healworld.me Support <${process.env.MAIL_USERNAME}>`,
      to: email,
      subject: "Your OTP Code for Healworld.me",
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Healworld.me - OTP Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #E97C00;">${otp}</h1>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>Healworld.me Team</strong></p>
        </body>
        </html>
      `,
    };

    // ✅ ส่งอีเมล
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);

    return { status: "success", message: "OTP has been sent to your email." };
  } catch (error) {
    console.error("🔥 Error sending OTP:", error);
    return { status: "error", message: "Failed to send OTP. Please try again later." };
  }
};

module.exports = sendOTP;
