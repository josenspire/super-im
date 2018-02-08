const mongoose = require('mongoose');
const GroupSchema = require('../schemas/group.server.schema');
const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;