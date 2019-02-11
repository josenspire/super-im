const mongoose = require('mongoose');
const TempGroupSchema = require('../schemas/tempGroup.schema');

module.exports = mongoose.model('TempGroup', TempGroupSchema);