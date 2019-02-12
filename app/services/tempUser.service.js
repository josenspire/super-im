const TempUserRepository = require('../repositories/tempUser.repository');

class TempUserService {
    getTempUserID (userID) {
        return TempUserRepository.getTempUserID(userID);
    };

    getUserProfileByTempUserID (tempUserID) {
        return TempUserRepository.getUserProfileByTempUserID(tempUserID);
    };
}

module.exports = new TempUserService();