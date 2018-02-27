const mongoose = require('mongoose');
const MemberSchema = require('../schemas/member.server.schema');
const Member = mongoose.model('Member', MemberSchema);

module.exports = Member;