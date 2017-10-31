const mongoose = require('mongoose')
let moment = require('moment')

let SMSSchema = new mongoose.Schema({
    // telephone
    telephone: {
        type: String,
        // unique: 'Telephone already exists',
        trim: true
    },
    
    codeType: {
        type: String,
        trim: true
    },

    verifyCode: {
        type: String,
        required: true
    },

    // date note
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    },

    // expires time 5min
    expiresAt: {
        type: Date,
        default: Date.now(),
        expires: 60 * 60
    }
})

SMSSchema.pre('save', function (next) {
    let verifyCode = this
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }
    this.expiresAt = Date.now();
    next()
})

SMSSchema.statics = {
    findById: function (id, cb) {
        return this
            .findOne({ _id: id })
            .exec(cb)
    },
}

module.exports = SMSSchema