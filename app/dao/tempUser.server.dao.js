const UserModel = require('../models/user.server.model');
const TempUserModel = require('../models/tempUser.server.model');
const Constants = require('../utils/Constants');
const DateUtils = require('../utils/DateUtils');
const StringUtil = require('../utils/StringUtil');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

const uuidv4 = require('uuid/v4');
const _ = require('lodash');

exports.getTempUserID = async (userID, cb) => {
    let result = { status: FAIL, data: {}, message: '' };
    let newTempUserID = uuidv4();
    try {
        let tempUser = await updateTempUserByUserID(userID, newTempUserID);
        if (tempUser) {
            result.data.tempUserID = newTempUserID;
        } else {
            let createResult = await createTempUser(userID);
            result.data.tempUserID = createResult.tempUserID;
        }
        result.status = SUCCESS;
    } catch (err) {
        result.message = err;
    }
    cb(result);
}

exports.getUserProfileByTempUserID = async (tempUserID, cb) => {
    let result = { status: FAIL, data: {}, message: '' };
    try {
        let tempUser = await queryTempUserByTempUserID(tempUserID);
        if (tempUser) {
            result.data.userProfile = convertUserProfile(tempUser.user);
            result.status = SUCCESS;
        } else {
            result.message = "This ID is expired, please reacquire";
        }
    } catch (err) {
        result.message = err;
    }
    cb(result);
}

var updateTempUserByUserID = (userID, newTempUserID) => {
    return new Promise((resolve, reject) => {
        TempUserModel.findOneAndUpdate({ user: userID }, { $set: { tempUserID:  newTempUserID} })
            .populate("user")
            .exec((err, tempUser) => {
                if (err) {
                    return reject(`Server error, query temp userID fail: ${err.message}`);
                }
                // tempUser.tempUserID = newTempUserID;
                resolve(tempUser);
            })
    })
}

var queryTempUserByUserID = userID => {
    return new Promise((resolve, reject) => {
        TempUserModel.findOne({ user: userID })
            .populate("user")
            .exec((err, tempUser) => {
                if (err) {
                    return reject(`Server error, query temp userID fail: ${err.message}`);
                }
                resolve(tempUser);
            })
    })
}

var queryTempUserByTempUserID = tempUserID => {
    return new Promise((resolve, reject) => {
        TempUserModel.findOne({ tempUserID: tempUserID })
            .populate("user")
            .exec((err, tempUser) => {
                if (err) {
                    return reject(`Server error, query temp userID fail: ${err.message}`);
                }
                resolve(tempUser);
            })
    })
}

var createTempUser = userID => {
    return new Promise((resolve, reject) => {
        var tempUser = new TempUserModel({ user: userID, tempUserID: uuidv4() });
        tempUser.save((err, result) => {
            if (err) return reject(`Server error, create temp user fail: ${err.message}`);
            resolve(result);
        });
    })
}

var convertUserProfile = userProfile => {
    let user = JSON.parse(JSON.stringify(userProfile));

    user.userID = userProfile._id;

    delete user._id;
    delete user.password;
    delete user.deviceID;
    delete user.meta;
    delete user.token;
    delete user.status;
    delete user.role;

    return user;
}