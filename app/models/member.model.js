const mongoose = require('mongoose');
const MemberSchema = require('../schemas/member.schema');

module.exports = mongoose.model('Member', MemberSchema);