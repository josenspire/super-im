const mongoose = require('mongoose')
const UserSchema = require('../schemas/user.server.schema')
const User = mongoose.model('User', UserSchema)

module.exports = User;