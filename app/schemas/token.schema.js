const mongoose = require('mongoose');
const DateUtils = require('../utils/DateUtils');

const expiresDays = 1000 * 60 * 60 * 24 * 30;

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

let TokenSchema = new mongoose.Schema({
    token: {
        type: String,
        unique: true,
        default: ""
    },

    expires: {
        type: Date,
        default: DateUtils.formatCommonUTCDate(Date.now() + expiresDays)
    },

    loginTime: {
        type: Date,
        default: DateUtils.formatCommonUTCDate(Date.now())
    },

    // belong to this user. ( one to one)
    user: {
        type: ObjectId,
        ref: 'User'
    },

    // date note
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
);


TokenSchema.pre('save', function (next) {
    if (this.isNew) {
        this.loginTime = DateUtils.formatCommonUTCDate(Date.now());
        this.expires = DateUtils.formatCommonUTCDate(Date.now() + expiresDays);
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
});

TokenSchema.statics = {
    findById: function (id, cb) {
        return this
            .findOne({ _id: id })
            .exec(cb)
    },
};

module.exports = TokenSchema;