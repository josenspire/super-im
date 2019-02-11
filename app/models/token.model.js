const mongoose = require('mongoose');
const TokenSchema = require('../schemas/token.schema');

TokenSchema.index({token: 1});

module.exports = mongoose.model('Token', TokenSchema);