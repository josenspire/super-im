const mongoose = require('mongoose')
const TempUserSchema = require('../schemas/tempUser.schema')
const TempUser = mongoose.model('TempUser', TempUserSchema)

module.exports = TempUser;