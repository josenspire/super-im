const IMProxie = require('../api/proxies/rongCloud.server.proxies')
const GroupDao = require("../dao/group.server.dao");
const TempGroupDao = require('../dao/tempGroup.server.dao');
const StringUtil = require("../utils/StringUtil");
const Constants = require("../utils/Constants");
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");
const _ = require("lodash");

exports.createGroup = (currentUser, groupInfo, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    GroupDao.createGroup(currentUser, groupInfo, async _result => {
        result = _.cloneDeep(_result);
        if (result.status != SUCCESS) return cb(result);

        const group = result.data.group;
        try {
            await IMProxie.createGroup(_.toString(group.groupID), group.name, convertMembers(groupInfo.members));
            await IMProxie.sendGroupNotification({
                currentUserID: _.toString(currentUser.userID),
                operation: Constants.GROUP_OPERATION_CREATE,
                group: group,
            });
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
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

            const group = result.data.group;

            const memberJoin = _.map(members, e => {
                return IMProxie.joinGroup(groupID, { id: e });
            });
            await Promise.all(memberJoin);
            await IMProxie.sendGroupNotification({
                currentUserID: _.toString(currentUser.userID),
                operation: Constants.GROUP_OPERATION_ADD,
                group: group,
                membersID: members,
            });
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        cb(result);
    })
}

exports.joinGroup = async (currentUser, groupID, joinType, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    let member = {
        userID: currentUser.userID,
        alias: currentUser.nickname
    };
    let _groupID = groupID;
    if (joinType === 'QrCode') {
        const groupResult = await TempGroupDao.getGroupProfileByTempGroupID(groupID);
        if (groupResult.status === SUCCESS) {
            _groupID = groupResult.data.group.groupID;
        } else {
            return cb(groupResult);
        }
    }
    GroupDao.joinGroup(member, _groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.joinGroup(_groupID, { id: member.userID });

            const currentUserID = _.toString(currentUser.userID);
            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_ADD,
                group: group,
                memberID: currentUserID,
            });
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        cb(result);
    })
}

exports.joinGroupByTempGroupID = (currentUser, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    let member = {
        userID: currentUser.userID,
        alias: currentUser.nickname
    };
    GroupDao.joinGroup(member, groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.joinGroup(groupID, { id: member.userID });

            const currentUserID = _.toString(currentUser.userID);
            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_ADD,
                group: group,
                memberID: currentUserID,
            });
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
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
            await IMProxie.quitGroup(groupID, { id: targetUserID });

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: targetUserID,
                targetUserDisplayNames: targetUserID || "",
                timestamp: Date.now()
            };
            await IMProxie.sendGroupNotification(currentUser.userID, Constants.GROUP_OPERATION_KICKED, content, group);
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        cb(result);
    });
}

exports.quitGroup = async (currentUser, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    const currentUserID = _.toString(currentUser.userID);
    const member = await GroupDao.queryMemberByGroupIDAndMemberID({ groupID, memberID: currentUser.userID });
    if (!member) {
        result.message = 'Invalid operation, your have not join into this group'
        return cb(result);
    }
    GroupDao.quitGroup(currentUserID, groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);
            await IMProxie.quitGroup(groupID, { id: currentUserID });
            if (result.data.isDismiss) {
                return cb(result);
            } else {
                const group = result.data.group;
                await IMProxie.sendGroupNotification({
                    currentUserID: currentUserID,
                    operation: Constants.GROUP_OPERATION_QUIT,
                    group: group,
                    member: member,
                    isIncludeSender: 0,
                });
            }
            result.data.group = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        cb(result);
    });
}

exports.dismissGroup = async (currentUser, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    const currentUserID = _.toString(currentUser.userID);

    const member = await GroupDao.queryMemberByGroupIDAndMemberID({ groupID, memberID: currentUser.userID });
    GroupDao.dismissGroup(currentUserID, groupID, async _result => {
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) return cb(result);

            let group = result.data.group;
            await IMProxie.dismissGroup(groupID, { id: currentUserID });

            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_QUIT,
                group: group,
                member: member,
            });
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
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
            await IMProxie.renameGroup(groupID, name);

            await IMProxie.sendGroupNotification({
                currentUserID: currentUser.userID,
                operation: Constants.GROUP_OPERATION_RENAME,
                group: group,
                name: name,
            });
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
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

            await IMProxie.sendGroupNotification({
                currentUserID: currentUser.userID,
                operation: Constants.GROUP_OPERATION_BULLETIN,
                group: group,
            });
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        cb(result);
    });
}

exports.updateGroupMemberAlias = (currentUser, groupID, alias, cb) => {
    GroupDao.updateGroupMemberAlias(groupID, currentUser.userID, alias, result => {
        cb(result);
    });
}

exports.getGroupList = (userID, cb) => {
    GroupDao.queryGroupList(userID, result => {
        cb(result);
    });
}

var convertMembers = members => {
    return _.map(members, e => {
        let item = {};
        item.id = e;
        return item;
    });
};
