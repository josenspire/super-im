const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

const DateUtils = require('../utils/DateUtils');

const TempUserSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: "User"
    },

    tempUserID: {
        type: String,
        default: ""
    },

    // expires time 5min
    expiresAt: {
        type: Date,
        default: DateUtils.formatCommonUTCDate(Date.now() + (5 * 60 * 1000)),
        expires: 5 * 60
    }
}, {
        versionKey: false,
        timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
    }
);

TempUserSchema.statics = {
    findById: function (id, cb) {
        return this
            .findOne({ _id: id })
            .exec(cb)
    }
};

module.exports = TempUserSchema;