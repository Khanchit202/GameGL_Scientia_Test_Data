
require('dotenv').config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const chalk = require("chalk");
const cors = require("cors");
const passport = require("passport");
const sessions = require("express-session");
const { RedisStore } = require("connect-redis");
const app = express(); // สร้าง instance ของ express



//? Databases 3
const connectMongoDB = require("./models/database/mongodb");
const redis = require("./models/database/redis");

connectMongoDB();
(async () => {
  await redis.connect();
})();

redis.on("connect", () => console.log(chalk.green("Redis Connected")));
redis.on("ready", () => console.log(chalk.green("Redis Ready")));
redis.on("error", (err) => console.log("Redis Client Error", err));

module.exports = redis;

//? Modules
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

let redisStore = new RedisStore({
  client: redis,
  prefix: "hdgtest:",
});



// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("trust proxy", false);


app.use(cors());  // หรือสามารถตั้งค่าตามที่ต้องการ

//? Sessions
app.use(
  sessions({
    secret: "secretkey",
    store: redisStore, // กำหนด RedisStore
    saveUninitialized: false,
    resave: false,
    cookie: {
      secure: false, // ใช้ true ถ้ารัน HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // อายุ session 1 วัน
    },
  })
);

// sessions แบบไม่ store
// app.use(
//   sessions({
//     secret: "secretkey",
//     saveUninitialized: true,
//     resave: false,
//   })
// );

//? PassportJS
app.use(passport.initialize());
app.use(passport.session());

// Cross Origin Resource Sharing

const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("joinActivity", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`${socket.id} joined activity ${chatRoomId}`);
  });

  socket.on("message", ({ activityId, message }) => {});

  socket.on("leaveActivity", (chatRoomId) => {
    socket.leave(chatRoomId);
    console.log(`${socket.id} left activity ${chatRoomId}`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });

  socket.on("reaction", (data) => {
    io.to(data.chatRoomId).emit("reaction", data);
  });
});


const v1IndexRouter2 = require("./routes/indexRoutes");
app.use("/", v1IndexRouter2);

//? Auth Endpoints
const AuthRouter = require("./routes/authRoutes");
app.use("/api/auth", AuthRouter);

//? Account Endpoints
const AccountRouter = require("./routes/accountRoutes");
app.use("/api/accounts", AccountRouter);


//? Item Endpoints
const ItemRoutes = require("./routes/itemRoutes");
app.use("/api/item", ItemRoutes);

//? Quests Endpoints
const QuestsRoutes = require("./routes/QuestsRoutes");
app.use("/api/quests", QuestsRoutes);

//? useritem Endpoints
const UseritemRoutes = require("./routes/useritemRoutes");
app.use("/api/useritem", UseritemRoutes);

//? payer Endpoints
const PayerRoutes = require("./routes/payerProgessRoutes");
app.use("/api/payer", PayerRoutes);

//? payerquests Endpoints
const PayerquestsRoutes = require("./routes/payerQuestsRoutes");
app.use("/api/payerquests", PayerquestsRoutes);

//? payerquests Endpoints
const SellRoutes = require("./routes/sellitem");
app.use("/api/sell", SellRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
// ตั้งค่าพอร์ต
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };





