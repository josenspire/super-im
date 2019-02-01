const mongoose = require('mongoose');
const DateUtils = require('../utils/DateUtils');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let CommentSchema = new mongoose.Schema({

    moment: {
        type: ObjectId,
        ref: "Moment"
    },
    fromUser: {                 // comment from this user
        type: ObjectId,
        ref: "User"
    },
    replyComment: [{           // reply this comment
        fromUser: {
            type: ObjectId,
            ref: "User"
        },
        toUser: {
            type: ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            default: ""
        }
    }],
    content: {
        type: String,
        default: ""
    },
    meta: {
        createAt: {
            type: Date,
            default: DateUtils.formatCommonUTCDate(Date.now())
        },
        updateAt: {
            type: Date,
            default: DateUtils.formatCommonUTCDate(Date.now())
        }
    }
}, {
        versionKey: false
    }
)

CommentSchema.pre('save', function (next) {
    let user = this
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
})

module.exports = CommentSchema