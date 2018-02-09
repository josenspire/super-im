const IMProxie = require('../api/proxies/rongCloud.server.proxies')
const GroupDao = require("../dao/group.server.dao");
const StringUtil = require("../utils/StringUtil");
const Constants = require("../utils/Constants");
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");
const _ = require("lodash");

exports.createGroup = (currentUser, groupInfo, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.createGroup(currentUser, groupInfo, async _result => {
        result = _.cloneDeep(_result);
        if (result.status != SUCCESS) return cb(result);

        let group = result.data.group;
        let members = convertMembers(group.members);
        try {
            await IMProxie.createGroup(group.groupID.toString(), group.name, members);
            let content = {
                operatorNickname: currentUser.nickname,
                targetGroupName: group.name,
                timestamp: Date.now()
            };
            IMProxie.sendGroupNotification(currentUser.userID.toString(), group.groupID.toString(), Constants.GROUP_OPERATION_CREATE, content, (err, code) => { });
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    });
}

exports.joinGroup = (currentUser, groupID, members, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.joinGroup(groupID, members, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.joinGroup(groupID, group.name, members);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: members,
                targetUserDisplayNames: members.alias || "",
                timestamp: Date.now()
            }
            IMProxie.sendGroupNotification(currentUser.userID.toString(), groupID, Constants.GROUP_OPERATION_ADD, content, (err, code) => { });
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    })

}

var convertMembers = members => {
    let _members = _.cloneDeep(members);
    return _members.map(member => {
        return member.userID;
    });
}