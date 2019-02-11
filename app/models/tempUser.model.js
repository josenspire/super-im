const mongoose = require('mongoose');
const TempUserSchema = require('../schemas/tempUser.schema');

module.exports = mongoose.model('TempUser', TempUserSchema);