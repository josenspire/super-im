const mongoose = require('mongoose')
const TokenSchema = require('../schemas/token.server.schema')
const Token = mongoose.model('Token', TokenSchema)

module.exports = Token;