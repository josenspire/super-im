const mongoose = require('mongoose');
const CommentSchema = require('../schemas/comment.server.schema');
const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;