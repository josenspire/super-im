const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let MemberSchema = new mongoose.Schema({
    groupID: {
        type: ObjectId,
        ref: "Group"
    },
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
}, {
        versionKey: false,
        timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
    }
);

module.exports = MemberSchema;