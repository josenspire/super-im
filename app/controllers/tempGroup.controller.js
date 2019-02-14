const TempGroupService = require('../services/tempGroup.service')
const {success, error} = require('../commons/response.common');

class TempGroupController {
    async getTempGroupID(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            const tempGroupInfo = await TempGroupService.getTempGroupID(params.groupID);
            result = success(tempGroupInfo);
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async getGroupProfileByTempGroupID(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            const groupInfo = await TempGroupService.getGroupProfileByTempGroupID(params.tempGroupID);
            result = success(groupInfo);
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    }
}

module.exports = new TempGroupController();
