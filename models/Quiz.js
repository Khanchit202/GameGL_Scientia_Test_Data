// models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = require('../schemas/quizSchema');
module.exports = mongoose.model('Quiz', quizSchema);