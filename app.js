const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require("body-parser");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use(bodyParser.json()); // รองรับ JSON จาก Unity

const objectRoutes = require('./routes/objectRoutes');
app.use('/api/object', objectRoutes);
app.use('/api/user', objectRoutes);

const quizRoutes = require('./routes/quizRoutes');
app.use('/api/quiz', quizRoutes);

const questRoutes = require('./routes/questRoutes');
app.use('/api/quest', questRoutes); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));