const _ = require("lodash");
const IMProxie = require('../api/proxies/rongCloud.server.proxies')
const GroupRepository = require("../repositories/group.repository");
const TempGroupRepository = require('../repositories/tempGroup.repository');
const Constants = require("../utils/Constants");
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');

class GroupService {
    async createGroup(currentUser, groupInfo) {
        const currentUserID = _.toString(currentUser.userID);
        let members = _.cloneDeep(groupInfo.members);
        members.push(currentUserID);

        const createResult = await GroupRepository.createGroup(currentUser, groupInfo);
        const group = createResult.group;
        try {
            await IMProxie.createGroup(_.toString(group.groupID), group.name, convertMembers(members));
            await IMProxie.sendGroupNotification({
                currentUserID,
                operation: Constants.GROUP_OPERATION_CREATE,
                group,
            });
        } catch (err) {
            throw new TError(FAIL, err.message);
        }
    };

    async addGroupMembers(currentUser, groupID, members) {
        const {group} = await GroupRepository.addGroupMembers(groupID, members);
        try {
            const memberJoin = _.map(members, e => {
                return IMProxie.joinGroup(groupID, {id: e});
            });
            await Promise.all(memberJoin);
            await IMProxie.sendGroupNotification({
                currentUserID: _.toString(currentUser.userID),
                operation: Constants.GROUP_OPERATION_ADD,
                group,
                membersID: members,
            });
        } catch (err) {
            throw new TError(FAIL, err.message);
        }
    };

    async joinGroup(currentUser, groupID, joinType) {
        const member = {
            userID: currentUser.userID,
            alias: currentUser.nickname
        };
        let _groupID = groupID;
        if (joinType === 'QrCode') {
            const {group} = await TempGroupRepository.getGroupProfileByTempGroupID(groupID);
            _groupID = group.groupID;
        }
        const {group} = await GroupRepository.joinGroup(member, _groupID);
        try {
            await IMProxie.joinGroup(_groupID, {id: member.userID});
            const currentUserID = _.toString(currentUser.userID);
            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_ADD,
                group: group,
                memberID: currentUserID,
            });
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    }

    async joinGroupByTempGroupID(currentUser, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        let member = {
            userID: currentUser.userID,
            alias: currentUser.nickname
        };
        const _result = await GroupRepository.joinGroup(member, groupID);
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
    };

    async kickGroupMember(currentUser, groupID, targetUserID) {
        const {group} = await GroupRepository.kickGroupMember(currentUser, groupID, targetUserID);
        try {
            await IMProxie.quitGroup(groupID, {id: targetUserID});
            // const content = {
            //     operatorNickname: currentUser.nickname,
            //     targetUserIds: targetUserID,
            //     targetUserDisplayNames: targetUserID || "",
            //     timestamp: Date.now()
            // };
            await IMProxie.sendGroupNotification({
                currentUserID: currentUser.userID,
                operation: Constants.GROUP_OPERATION_KICKED,
                group,
                memberID: _.toString(currentUser.userID),
            });
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    async quitGroup(currentUser, groupID) {
        const currentUserID = _.toString(currentUser.userID);
        const member = await GroupRepository.queryMemberByGroupIDAndMemberID({groupID, memberID: currentUser.userID});
        if (_.isEmpty(member)) {
            throw new TError(FAIL, 'Operation failure, your have not join into this group');
        }
        const {isDismiss, group} = await GroupRepository.quitGroup(currentUserID, groupID);
        try {
            await IMProxie.quitGroup(groupID, {id: currentUserID});
            if (isDismiss) {
                // TODO: group dismiss
            } else {
                await IMProxie.sendGroupNotification({
                    currentUserID: currentUserID,
                    operation: Constants.GROUP_OPERATION_QUIT,
                    group,
                    member,
                    isIncludeSender: 0,
                });
            }
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    async dismissGroup(currentUser, groupID) {
        const currentUserID = _.toString(currentUser.userID);

        const member = await GroupRepository.queryMemberByGroupIDAndMemberID({groupID, memberID: currentUser.userID});
        const {group} = await GroupRepository.dismissGroup(currentUserID, groupID);
        try {
            await IMProxie.dismissGroup(groupID, {id: currentUserID});
            await IMProxie.sendGroupNotification({
                currentUserID: currentUserID,
                operation: Constants.GROUP_OPERATION_QUIT,
                group,
                member,
            });
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    async renameGroup(currentUser, groupID, name) {
        const {group} = await GroupRepository.renameGroup(groupID, name);
        try {
            await IMProxie.renameGroup(groupID, name);
            await IMProxie.sendGroupNotification({
                currentUserID: currentUser.userID,
                operation: Constants.GROUP_OPERATION_RENAME,
                group: group,
                name: name,
            });
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    async updateGroupNotice(currentUser, groupID, notice) {
        const {group} = await GroupRepository.updateGroupNotice(groupID, notice);
        try {
            await IMProxie.renameGroup(currentUser.userID, groupID);
            await IMProxie.sendGroupNotification({
                currentUserID: currentUser.userID,
                operation: Constants.GROUP_OPERATION_BULLETIN,
                group: group,
            });
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    updateGroupMemberAlias(currentUser, groupID, alias) {
        return GroupRepository.updateGroupMemberAlias(groupID, currentUser.userID, alias);
    };

    getGroupList(userID) {
        return GroupRepository.queryGroupList(userID);
    };
}

const convertMembers = members => {
    return _.map(members, e => {
        let item = {};
        item.id = e;
        return item;
    });
};

module.exports = new GroupService();
