const mongoose = require('mongoose');
const DateUtils = require('../utils/DateUtils');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let CommunitySchema = new mongoose.Schema({

    userID: {           // belong to
        type: ObjectId,
        ref: "User"
    },
    moments: [{
        user: {
            type: ObjectId,
            ref: "User"
        },
        moment: {
            type: ObjectId,
            ref: 'Moment'
        }
    }],
    status: {
        type: Number,
        default: 1
    },
    permission: {
        type: Number,
        default: 1
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

CommunitySchema.pre('save', function (next) {
    let user = this
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
})

module.exports = CommunitySchema