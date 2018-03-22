const TempGroupDao = require('../dao/tempGroup.server.dao');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

exports.getTempGroupID = async groupID => {
    return await TempGroupDao.getTempGroupID(groupID);
}

exports.getGroupProfileByTempGroupID = async tempGroupID => {
    return await TempGroupDao.getGroupProfileByTempGroupID(tempGroupID);
}