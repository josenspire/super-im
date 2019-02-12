const TempUserModel = require('../models/tempUser.model');
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');
const uuidv4 = require('uuid/v4');

class TempUserRepository {
    /**
     * Get temp userID
     * @param {string} userID
     * @returns {Promise<string>}
     */
    async getTempUserID(userID) {
        let tempUserID = '';
        const newTempUserID = uuidv4();
        const tempUser = await updateTempUserByUserID(userID, newTempUserID);
        if (tempUser) {
            tempUserID = newTempUserID;
        } else {
            const createResult = await createTempUser(userID);
            tempUserID = createResult.tempUserID;
        }
        return {tempUserID};
    };

    /**
     * Query user profile by temp userID
     * @param {string} tempUserID
     * @returns {Promise<Object>}
     */
    async getUserProfileByTempUserID(tempUserID) {
        const tempUser = await queryTempUserByTempUserID(tempUserID);
        if (tempUser) {
            return {userProfile: convertUserProfile(tempUser.user)};
        } else {
            throw new TError(FAIL, "This ID is expired, please reacquire");
        }
        return result;
    };
}

const updateTempUserByUserID = async (userID, newTempUserID) => {
    return TempUserModel.findOneAndUpdate({user: userID}, {$set: {tempUserID: newTempUserID}})
        .populate("user")
        .exec()
        .catch(err => {
            console.log(err);
            throw new TError(SERVER_UNKNOW_ERROR, `Server error, query temp userID fail`);
        });
};

const queryTempUserByTempUserID = tempUserID => {
    return TempUserModel.findOne({tempUserID})
        .populate("user")
        .exec()
        .catch(err => {
            console.log(err);
            throw new TError(SERVER_UNKNOW_ERROR, `Server error, query temp userID fail`);
        });
};

const createTempUser = userID => {
    try {
        const tempUser = new TempUserModel({user: userID, tempUserID: uuidv4()});
        return tempUser.save();
    } catch (err) {
        console.log(err);
        throw new TError(SERVER_UNKNOW_ERROR, `Server error, create temp user fail`);
    }
};

const convertUserProfile = userProfile => {
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