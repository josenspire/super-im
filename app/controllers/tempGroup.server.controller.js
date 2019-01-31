const TempGroupService = require('../services/tempGroup.server.service')

class TempGroupController {
    async getTempGroupID(req, res, next) {
        const input = req.data.input;
        const groupID = input.groupID;

        req.data.output = await TempGroupService.getTempGroupID(groupID);
        next();
    };

    async getGroupProfileByTempGroupID(req, res, next) {
        const input = req.data.input;
        const tempGroupID = input.tempGroupID || "";

        req.data.output = await TempGroupService.getGroupProfileByTempGroupID(tempGroupID);
        next();
    }
};

module.exports = new TempGroupController();
