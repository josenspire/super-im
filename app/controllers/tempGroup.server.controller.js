const TempGroupService = require('../services/tempGroup.server.service')

exports.getTempGroupID = async (req, res, next) => {
    let input = req.data.input;
    let groupID = input.groupID;

    let result = await TempGroupService.getTempGroupID(groupID);
    req.data.output = result;
    next();
}

exports.getGroupProfileByTempGroupID = async (req, res, next) => {
    let input = req.data.input;
    let tempGroupID = input.tempGroupID || "";

    let result = await TempGroupService.getGroupProfileByTempGroupID(tempGroupID);
    req.data.output = result;
    next();
}