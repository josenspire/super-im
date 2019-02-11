const mongoose = require('mongoose')
const UserSchema = require('../schemas/user.schema')

UserSchema.index({telephone: 1});
UserSchema.index({nickname: 1});

module.exports = mongoose.model('User', UserSchema);