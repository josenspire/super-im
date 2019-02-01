const mongoose = require('mongoose')
const UserSchema = require('../schemas/user.schema')
const User = mongoose.model('User', UserSchema)

module.exports = User;