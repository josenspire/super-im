const mongoose = require('mongoose');
const MemberSchema = require('../schemas/member.schema');
const Member = mongoose.model('Member', MemberSchema);

module.exports = Member;