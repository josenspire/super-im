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
        default: ""
    },

    status: {
        type: Boolean,
        default: true
    }
}, {
        versionKey: false,
        timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
    }
)

module.exports = GroupSchema