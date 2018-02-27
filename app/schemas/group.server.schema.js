const mongoose = require('mongoose');
const DateUtils = require('../utils/DateUtils');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let GroupSchema = new mongoose.Schema({

    createBy: {
        type: ObjectId,
        ref: "User"
    },

    owner: {
        type: ObjectId,
        ref: "User"
    },

    name: {
        type: String,
        default: "Undefined Group Name"
    },

    notice: {
        type: String,
        default: ""
    },

    avatar: {
        type: String,
        default: null
    },

    status: {
        type: Boolean,
        default: true
    },

    members: [{
        userID: {
            type: ObjectId,
            ref: "User"
        },
        alias: {
            type: String,
            default: ""
        },
        role: {
            type: Number,
            default: 0
        },
        status: {
            type: Number,
            default: 0
        }
    }],
}, {
        versionKey: false,
        timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
    }
)

module.exports = GroupSchema