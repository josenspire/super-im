const mongoose = require('mongoose')

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

const DateUtils = require('../utils/DateUtils');

let TempGroupSchema = new mongoose.Schema({
    group: {
        type: ObjectId,
        ref: "Group"
    },

    tempGroupID: {
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
)

module.exports = TempGroupSchema;