const TempUserDao = require('../dao/tempUser.server.dao');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

const uuidv4 = require('uuid/v4');

exports.getTempUserID = (userID, cb) => {
    TempUserDao.getTempUserID(userID, result => {
        cb(result);
    })
}

exports.getUserProfileByTempUserID = (tempUserID, cb) => {
    TempUserDao.getUserProfileByTempUserID(tempUserID, result => {
        cb(result);
    })
}