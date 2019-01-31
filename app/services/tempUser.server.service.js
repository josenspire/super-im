const TempUserDao = require('../dao/tempUser.server.dao');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

class TempUserService {
    getTempUserID (userID) {
        return TempUserDao.getTempUserID(userID);
    };

    getUserProfileByTempUserID (tempUserID) {
        return TempUserDao.getUserProfileByTempUserID(tempUserID);
    };
};

module.exports = new TempUserService();