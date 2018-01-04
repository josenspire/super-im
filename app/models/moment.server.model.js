const mongoose = require('mongoose');
const MomentSchema = require('../schemas/moment.server.schema');
const Moment = mongoose.model('Moment', MomentSchema);

module.exports = Moment;