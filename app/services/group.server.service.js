const IMProxie = require('../api/proxies/rongCloud.server.proxies')
const GroupDao = require("../repositories/group.server.dao");
const TempGroupDao = require('../repositories/tempGroup.server.dao');
const Constants = require("../utils/Constants");
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const _ = require("lodash");

class GroupService {
    async createGroup(currentUser, groupInfo) {
        let result = {status: FAIL, data: {}, message: ""};
        const currentUserID = _.toString(currentUser.userID);
        let members = _.cloneDeep(groupInfo.members);
        members.push(currentUserID);
        
        const createResult = await GroupDao.createGroup(currentUser, groupInfo);
        result = _.cloneDeep(createResult);
        if (result.status != SUCCESS) {
            return result;
        }
        const group = result.data.group;
        try {
            await IMProxie.createGroup(_.toString(group.groupID), group.name, convertMembers(members));
            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_CREATE,
                group: group,
            });
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        return result;
    }

    async addGroupMembers(currentUser, groupID, members) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const _result = await GroupDao.addGroupMembers(groupID, members);
            result = _.cloneDeep(_result);
            if (result.status !== SUCCESS) {
                return result;
            }
            const group = result.data.group;
            const memberJoin = _.map(members, e => {
                return IMProxie.joinGroup(groupID, {id: e});
            });
            await Promise.all(memberJoin);
            await IMProxie.sendGroupNotification({
                currentUserID: _.toString(currentUser.userID),
                operation: Constants.GROUP_OPERATION_ADD,
                group: group,
                membersID: members,
            });
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        return result;
    }

    async joinGroup (currentUser, groupID, joinType) {
        let result = {status: FAIL, data: {}, message: ""};
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
                return groupResult;
            }
        }
        const _result = await GroupDao.joinGroup(member, _groupID);
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) {
                return result;
            }
            let group = result.data.group;
            await IMProxie.joinGroup(_groupID, {id: member.userID});

            const currentUserID = _.toString(currentUser.userID);
            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_ADD,
                group: group,
                memberID: currentUserID,
            });
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        return result;
    }

    async joinGroupByTempGroupID(currentUser, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        let member = {
            userID: currentUser.userID,
            alias: currentUser.nickname
        };
        const _result = await GroupDao.joinGroup(member, groupID);
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) {
                return result;
            }
            const group = result.data.group;
            await IMProxie.joinGroup(groupID, {id: member.userID});

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
        return result;
    }

    async kickGroupMember(currentUser, groupID, targetUserID) {
        let result = {status: FAIL, data: {}, message: ""};
        const _result = await GroupDao.kickGroupMember(currentUser, groupID, targetUserID);
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) {
                return result;
            }
            const group = result.data.group;
            await IMProxie.quitGroup(groupID, {id: targetUserID});

            let content = {
                operatorNickname: currentUser.nickname,
                targetUserIds: targetUserID,
                targetUserDisplayNames: targetUserID || "",
                timestamp: Date.now()
            };
            await IMProxie.sendGroupNotification(currentUser.userID, Constants.GROUP_OPERATION_KICKED, content, group);
            result.data = {};
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        return result;
    }

    async quitGroup (currentUser, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        const currentUserID = _.toString(currentUser.userID);
        const member = await GroupDao.queryMemberByGroupIDAndMemberID({groupID, memberID: currentUser.userID});
        if (!member) {
            result.message = 'Invalid operation, your have not join into this group'
            return result;
        }
        const _result = await GroupDao.quitGroup(currentUserID, groupID);
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) {
                return result;
            }
            await IMProxie.quitGroup(groupID, {id: currentUserID});
            if (result.data.isDismiss) {
                return result;
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
            delete result.data.group;
        } catch (err) {
            result.status = FAIL;
            result.data = {};
            result.message = err.message;
        }
        return result;
    }

    async dismissGroup (currentUser, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        const currentUserID = _.toString(currentUser.userID);

        const member = await GroupDao.queryMemberByGroupIDAndMemberID({groupID, memberID: currentUser.userID});
        const _result = await GroupDao.dismissGroup(currentUserID, groupID);
        result = _.cloneDeep(_result);
        try {
            if (result.status != SUCCESS) {
                return result;
            }
            const group = result.data.group;
            await IMProxie.dismissGroup(groupID, {id: currentUserID});

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
        return result;
    }

    async renameGroup(currentUser, groupID, name, cb) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const _result = await GroupDao.renameGroup(groupID, name);
            result = _.cloneDeep(_result);
            if (result.status != SUCCESS) {
                return result;
            }
            const group = result.data.group;
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
        return result;
    };

    async updateGroupNotice(currentUser, groupID, notice) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const _result = await GroupDao.updateGroupNotice(groupID, notice);
            result = _.cloneDeep(_result);
            if (result.status != SUCCESS) {
                return result;
            }
            const group = result.data.group;
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
        return result;
    }

    updateGroupMemberAlias(currentUser, groupID, alias) {
        return GroupDao.updateGroupMemberAlias(groupID, currentUser.userID, alias);
    };

    getGroupList(userID) {
        return GroupDao.queryGroupList(userID);
    }
};

module.exports = new GroupService();


var convertMembers = members => {
    return _.map(members, e => {
        let item = {};
        item.id = e;
        return item;
    });
};
