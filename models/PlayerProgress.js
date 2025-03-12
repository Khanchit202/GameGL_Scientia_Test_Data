const mongoose = require('mongoose');
const playerProgressSchema = require('../schemas/playerPrograssSchema');

module.exports = mongoose.model('PlayerProgress', playerProgressSchema);