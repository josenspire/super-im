const mongoose = require('mongoose');
const DateUtils = require('../utils/DateUtils');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let MomentSchema = new mongoose.Schema({

    userID: {        // belong to
        type: ObjectId,
        ref: "User"
    },
    momentContent: {
        type: String,
        default: "",
        trim: false
    },
    picture: [{
        url: { type: String, default: null },
    }],
    permission: {   // who can visit this moment message
        type: Number,
        default: 0
    },
    status: {       // active or inactive
        type: Number,
        default: 1
    },
    publishAt: {
        type: Date,
        default: DateUtils.formatCommonUTCDate(Date.now())
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


MomentSchema.pre('save', function (next) {
    let user = this
    if (this.isNew) {
        this.publishAt = this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
})

module.exports = MomentSchema