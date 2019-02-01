const TempUserDao = require('../repositories/tempUser.server.dao');

class TempUserService {
    getTempUserID (userID) {
        return TempUserDao.getTempUserID(userID);
    };

    getUserProfileByTempUserID (tempUserID) {
        return TempUserDao.getUserProfileByTempUserID(tempUserID);
    };
};

module.exports = new TempUserService();