const mongoose = require('mongoose')
const SMSSchema = require('../schemas/sms.server.schema')
const SMS = mongoose.model('SMS', SMSSchema)

module.exports = SMS;