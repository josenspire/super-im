const TempUserModel = require('../models/tempUser.server.model');
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");

const uuidv4 = require('uuid/v4');
const _ = require('lodash');

class TempUserRepository {

    /**
     * Get temp userID
     * @param {string} userID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async getTempUserID(userID) {
        let result = {status: FAIL, data: {}, message: ''};
        const newTempUserID = uuidv4();
        try {
            const tempUser = await updateTempUserByUserID(userID, newTempUserID);
            if (tempUser) {
                result.data.tempUserID = newTempUserID;
            } else {
                const createResult = await createTempUser(userID);
                result.data.tempUserID = createResult.tempUserID;
            }
            result.status = SUCCESS;
        } catch (err) {
            console.log(err);
            result.message = err;
        }
        return result;
    }

    /**
     * Query user profile by temp userID
     * @param {string} tempUserID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async getUserProfileByTempUserID(tempUserID) {
        let result = {status: FAIL, data: {}, message: ''};
        try {
            const tempUser = await queryTempUserByTempUserID(tempUserID);
            if (tempUser) {
                result.data.userProfile = convertUserProfile(tempUser.user);
                result.status = SUCCESS;
            } else {
                result.message = "This ID is expired, please reacquire";
            }
        } catch (err) {
            result.message = err;
        }
        return result;
    };
};

var updateTempUserByUserID = async (userID, newTempUserID) => {
    return TempUserModel.findOneAndUpdate({user: userID}, {$set: {tempUserID: newTempUserID}})
        .populate("user")
        .exec()
        .catch(err => {
            throw new Error(`Server error, query temp userID fail: ${err.message}`);
        });
}

var queryTempUserByTempUserID = tempUserID => {
    return TempUserModel
        .findOne({tempUserID})
        .populate("user").exec().catch(err => {
            throw new Error(`Server error, query temp userID fail: ${err.message}`);
        });
}

var createTempUser = userID => {
    try {
        const tempUser = new TempUserModel({user: userID, tempUserID: uuidv4()});
        return tempUser.save().lean();
    } catch (err) {
        throw new Error(`Server error, create temp user fail: ${err.message}`);
    }
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
};

module.exports = new TempUserRepository();