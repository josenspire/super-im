const TempGroupRepository = require('../repositories/tempGroup.repository');

class TempGroupService {
    getTempGroupID(groupID) {
        return TempGroupRepository.getTempGroupID(groupID);
    };

    getGroupProfileByTempGroupID(tempGroupID) {
        return TempGroupRepository.getGroupProfileByTempGroupID(tempGroupID);
    };
}

module.exports = new TempGroupService();