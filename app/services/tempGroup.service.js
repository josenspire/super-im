const TempGroupDao = require('../repositories/tempGroup.repository');

class TempGroupService {
    async getTempGroupID(groupID) {
        return await TempGroupDao.getTempGroupID(groupID);
    };

    async getGroupProfileByTempGroupID(tempGroupID) {
        return await TempGroupDao.getGroupProfileByTempGroupID(tempGroupID);
    };
};

module.exports = new TempGroupService;