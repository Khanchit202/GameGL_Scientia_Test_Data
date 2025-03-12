const mongoose = require('mongoose');
const questSchema = require('../schemas/questSchema');

module.exports = mongoose.model('Quest', questSchema);