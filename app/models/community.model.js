const mongoose = require('mongoose');
const CommunitySchema = require('../schemas/community.schema');
const Community = mongoose.model('Community', CommunitySchema);

module.exports = Community;