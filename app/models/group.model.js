const mongoose = require('mongoose');
const GroupSchema = require('../schemas/group.schema');

module.exports = mongoose.model('Group', GroupSchema);