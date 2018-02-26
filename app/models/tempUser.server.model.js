const mongoose = require('mongoose')
const TempUserSchema = require('../schemas/tempUser.server.schema')
const TempUser = mongoose.model('TempUser', TempUserSchema)

module.exports = TempUser;