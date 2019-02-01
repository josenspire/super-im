const mongoose = require('mongoose')
const SMSSchema = require('../schemas/sms.schema')
const SMS = mongoose.model('SMS', SMSSchema)

module.exports = SMS;