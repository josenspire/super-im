const mongoose = require('mongoose');
const CommentSchema = require('../schemas/comment.schema');

module.exports = mongoose.model('Comment', CommentSchema);