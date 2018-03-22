const mongoose = require('mongoose');
const TempGroupSchema = require('../schemas/tempGroup.server.schema');
const TempGroup = mongoose.model('TempGroup', TempGroupSchema);

module.exports = TempGroup;