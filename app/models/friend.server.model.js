const mongoose = require('mongoose')
const FriendSchema = require('../schemas/friend.server.schema')
const Friend = mongoose.model('Friend', FriendSchema)

module.exports = Friend;