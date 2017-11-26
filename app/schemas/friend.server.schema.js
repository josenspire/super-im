const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const DateUtils = require('../utils/DateUtils');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let FriendSchema = new mongoose.Schema({

    userID: {
        type: ObjectId,
        ref: 'User'
    },

    friends: [{
        type: ObjectId,
        ref: 'User'
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

FriendSchema.pre('save', function (next) {
    let user = this
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    next();
})

module.exports = FriendSchema