const mongoose = require('mongoose');
const MomentSchema = require('../schemas/moment.schema');

module.exports = mongoose.model('Moment', MomentSchema);