const mongoose = require('mongoose')
const uuidv4 = require('uuid/v4');

let Schema = mongoose.Schema
let ObjectId = Schema.Types.ObjectId

let TokenSchema = new mongoose.Schema({

    token: {
        type: String,
        default: ''
    },

    expires: {
        type: Date,
        default: Date.now() + (1000 * 60 * 60 * 24)
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
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
})

TokenSchema.pre('save', function (next) {
    let token = this
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    } else {
        this.meta.updateAt = Date.now()
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

module.exports = TokenSchema