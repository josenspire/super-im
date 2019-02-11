const mongoose = require('mongoose');
const CommunitySchema = require('../schemas/community.schema');

module.exports = mongoose.model('Community', CommunitySchema);