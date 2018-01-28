const mongoose = require('mongoose');
const DateUtils = require('../utils/DateUtils');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let ContactSchema = new mongoose.Schema({

    userID: {
        type: String
    },

    contacts: [{
        userID: {
            type: ObjectId,
            ref: 'User'
        },
        remark: {
            remarkName: {
                type: String,
                default: ''
            },
            telephone: {
                type: Array,
                default: []
            },
            description: {
                type: String,
                default: ''
            },
            tags: {
                type: Array,
                default: []
            }
        }
    }],

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

})

ContactSchema.pre('save', function (next) {
    let user = this
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
})

module.exports = ContactSchema