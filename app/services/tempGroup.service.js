const TempGroupRepository = require('../repositories/tempGroup.repository');

class TempGroupService {
    async getTempGroupID(groupID) {
        return await TempGroupRepository.getTempGroupID(groupID);
    };

    async getGroupProfileByTempGroupID(tempGroupID) {
        return await TempGroupRepository.getGroupProfileByTempGroupID(tempGroupID);
    };
};

module.exports = new TempGroupService();