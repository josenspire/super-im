const mongoose = require('mongoose');
const TempGroupSchema = require('../schemas/tempGroup.schema');
const TempGroup = mongoose.model('TempGroup', TempGroupSchema);

module.exports = TempGroup;