const mongoose = require('mongoose')
const uuidv4 = require('uuid/v4');
const DateUtils = require('../utils/DateUtils')

let Schema = mongoose.Schema
let ObjectId = Schema.Types.ObjectId

let TokenSchema = new mongoose.Schema({

    token: {
        type: String,
        unique: true,
        default: ''
    },

    expires: {
        type: Date,
        default: DateUtils.formatCommonUTCDate(Date.now() + (1000 * 60 * 60 * 24))
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
)


TokenSchema.pre('save', function (next) {
    let token = this
    if (this.isNew) {
        this.loginTime = DateUtils.formatCommonUTCDate(Date.now());
        this.expires = DateUtils.formatCommonUTCDate(Date.now() + (1000 * 60 * 60 * 24));
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
})

TokenSchema.statics = {
    findById: function (id, cb) {
        return this
            .findOne({ _id: id })
            .exec(cb)
    },
}

module.exports = TokenSchema;