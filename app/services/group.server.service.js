const GroupDao = require("../dao/group.server.dao");

const StringUtil = require("../utils/StringUtil");
const Constants = require("../utils/Constants");

exports.createGroup = (currentUserID, groupInfo, cb) => {

    GroupDao.createGroup(currentUserID, groupInfo, result => {
        cb();
    })
}