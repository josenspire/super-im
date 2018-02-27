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

exports.addGroupMembers = (currentUser, groupID, members, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.addGroupMembers(groupID, members, async _result => {
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
            };
            IMProxie.sendGroupNotification(currentUser.userID.toString(), groupID, Constants.GROUP_OPERATION_ADD, content);
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    })
}

exports.joinGroup = (currentUser, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    let member = {
        userID: currentUser.userID,
        alias: currentUser.alias
    };
    GroupDao.joinGroup(member, groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.joinGroup(groupID, group.name, [member]);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: member,
                targetUserDisplayNames: member.alias || "",
                timestamp: Date.now()
            };
            await IMProxie.sendGroupNotification(currentUser.userID.toString(), groupID, Constants.GROUP_OPERATION_ADD, content);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    })
}

exports.kickGroupMember = (currentUser, groupID, targetUserID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.kickGroupMember(currentUser, groupID, targetUserID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.quitGroup(groupID, targetUserID);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: targetUserID,
                targetUserDisplayNames: targetUserID || "",
                timestamp: Date.now()
            };
            IMProxie.sendGroupNotification(currentUser.userID, groupID, Constants.GROUP_OPERATION_KICKED, content);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    });
}

exports.quitGroup = (currentUser, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.quitGroup(currentUser.userID, groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);
            let group = result.data.group;
            await IMProxie.quitGroup(groupID, currentUser.userID);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: currentUser.userID,
                targetUserDisplayNames: currentUser.nickname || "",
                timestamp: Date.now()
            };
            IMProxie.sendGroupNotification(currentUser.userID, groupID, Constants.GROUP_OPERATION_QUIT, content);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    });
}

exports.dismissGroup = (currentUser, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.dismissGroup(currentUser.userID, groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.dismissGroup(currentUser.userID, groupID);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: currentUser.userID,
                targetUserDisplayNames: currentUser.nickname || "",
                timestamp: Date.now()
            };
            IMProxie.sendGroupNotification(currentUser.userID, groupID, Constants.GROUP_OPERATION_DISMISS, content);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    });
}

exports.renameGroup = (currentUser, groupID, name, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.renameGroup(groupID, name, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.renameGroup(currentUser.userID, groupID);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: currentUser.userID,
                targetUserDisplayNames: currentUser.nickname || "",
                timestamp: Date.now()
            };
            IMProxie.sendGroupNotification(currentUser.userID, groupID, Constants.GROUP_OPERATION_RENAME, content);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    });
}

exports.updateGroupNotice = (currentUser, groupID, notice, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.updateGroupNotice(groupID, notice, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.renameGroup(currentUser.userID, groupID);

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: currentUser.userID,
                targetUserDisplayNames: currentUser.nickname || "",
                timestamp: Date.now()
            };
            IMProxie.sendGroupNotification(currentUser.userID, groupID, Constants.GROUP_OPERATION_BULLETIN, content);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err;
        }
        cb(result);
    });
}

exports.updateGroupMemberAlias = (currentUser, groupID, alias, cb) => {
    GroupDao.updateGroupMemberAlias(groupID, currentUser.userID, alias, result => {
        cb(result);
    });
}

var convertMembers = members => {
    let _members = _.cloneDeep(members);
    return _members.map(member => {
        return member.userID;
    });
}