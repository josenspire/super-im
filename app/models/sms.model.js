const mongoose = require('mongoose');
const SMSSchema = require('../schemas/sms.schema');

SMSSchema.index({telephone: 1});

module.exports = mongoose.model('SMS', SMSSchema);