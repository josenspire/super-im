const _ = require("lodash");
const mongoose = require('mongoose')

const GroupModel = require("../models/group.model");
const MemberModel = require("../models/member.model");

const Constants = require("../utils/Constants");
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');

class GroupRepository {
    /**
     * Create a user contact group
     * @param {Object} currentUser
     * @param {Object} groupInfo
     * @returns {Promise<{group: any}>}
     */
    async createGroup(currentUser, groupInfo) {
        const groupID = mongoose.Types.ObjectId();
        const isGroupOverflow = await isGroupCountOverflow(currentUser.userID);
        if (isGroupOverflow) {
            throw new TError(FAIL, `Current user's group count is out of max user group count limit (${Constants.MAX_USER_GROUP_OWN_COUNT})`);
        }
        const group = generateGroupObject(currentUser, groupID, groupInfo);
        let members = generateMembersObject(groupID, groupInfo.members, currentUser);

        let _group = JSON.parse(JSON.stringify(await saveGroup(group)));
        await saveMembers(members);
        _group.members = await queryMembersByGroupID(groupID);
        return {group: convertGroup(_group)};
    };

    /**
     * Add members to group
     * @param {string} groupID
     * @param {Array} members
     * @returns {Promise<{group: *}>}
     */
    async addGroupMembers(groupID, members) {
        const groupMembers = await queryMembersByGroupID(groupID);
        // TODO: need to check group is existed ?
        if ((groupMembers.length + members.length) > Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT) {
            throw new TError(FAIL, `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`);
        } else {
            const membersObject = generateMembersObject(groupID, members);
            await addMemberToGroup(groupID, membersObject);
            // TODO: need to check and remove dulplicate members
            const group = await queryGroupDataByGroupID(groupID);
            return {group: convertGroup(group)}
        }
    };

    /**
     * Join to one group
     * @param {Object} member
     * @param {string} groupID
     * @returns {Promise<{group: any}>}
     */
    async joinGroup(member, groupID) {
        // TODO: need to check group is existed ?
        const groupMembers = await queryMembersByGroupID(groupID);
        if (isMemberExistedGroup(groupMembers, member.userID)) {
            throw new TError(FAIL, "You are currently group member, please do not repeat");
        } else {
            if ((groupMembers.length >= Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT)) {
                throw new TError(FAIL, `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`);
            }
            await joinToGroup(groupID, member);

            const currentGroupData = await queryGroupDataByGroupID(groupID);
            return {
                group: convertGroup(currentGroupData),
            };
        }
    };

    /**
     * Kick a group member
     * @param {Object} currentUser
     * @param {string} groupID
     * @param {string} targetUserID
     * @returns {Promise<{group: any}>}
     */
    async kickGroupMember(currentUser, groupID, targetUserID) {
        const group = await queryGroupByID(groupID);
        const groupMembers = await queryMembersByGroupID(groupID);
        if (checkTargetUserIsCurrentUser(targetUserID, group.owner)) {
            throw new TError(FAIL, "You can't kick your self as a member");
        } else if (!isGroupOwnerOrAdmin(group, currentUser.userID)) {
            throw new TError(FAIL, "You do not have the right to do this");
        } else {
            if (!isMemberExistedGroup(groupMembers, targetUserID)) {
                throw new TError(FAIL, "This user is not in current group");
            } else {
                await removeGroupMember(groupID, targetUserID);

                const currentGroupData = await queryGroupDataByGroupID(groupID);
                return {
                    group: convertGroup(currentGroupData),
                };
            }
        }
    };

    /**
     * Quit group
     * @param currentUserID
     * @param groupID
     * @returns {Promise<{isDismiss: boolean}>}
     */
    async quitGroup(currentUserID, groupID) {
        const group = await queryGroupByID(groupID);
        const groupMembers = await queryMembersByGroupID(groupID);

        if (!isMemberExistedGroup(groupMembers, currentUserID)) {
            throw new TError(FAIL, "You are not in current group");
        } else {
            if (groupMembers.length <= 1) {
                // If members less than 1, group will dismiss
                await dismissGroup(groupID);
                return {
                    isDismiss: true,
                    group: {},
                };
            } else {
                await removeGroupMember(groupID, currentUserID);
                if (isGroupOwnerOrAdmin(group, currentUserID)) {
                    // Default make secondly members as owner
                    updateGroupOwner(groupID, groupMembers[1].userID._id);
                }
                const currentGroupData = await queryGroupDataByGroupID(groupID);
                return {
                    isDismiss: false,
                    group: convertGroup(currentGroupData),
                };
            }
        }
    };

    /**
     * Dismiss use's group
     * @param {string} userID
     * @param {string} groupID
     * @returns {Promise<{group: Object}>}
     */
    async dismissGroup(userID, groupID) {
        const group = await queryGroupByID(groupID);
        if (!isGroupOwnerOrAdmin(group, userID)) {
            throw new TError(FAIL, "You do not have the right to do this");
        }
        const currentGroupData = await queryGroupDataByGroupID(groupID);
        await dismissGroup(groupID);
        return {
            group: convertGroup(currentGroupData),
        };
    };

    /**
     * Rename group name
     * @param {string} groupID
     * @param {string} name
     * @returns {Promise<{group: Object}>}
     */
    async renameGroup(groupID, name) {
        await updateGroupProfile(groupID, {name});
        const currentGroupData = await queryGroupDataByGroupID(groupID);
        return {
            group: convertGroup(currentGroupData),
        };
    };

    /**
     * Update group notice information
     * @param {string} groupID
     * @param {string} notice
     * @returns {Promise<{group: Object}>}
     */
    async updateGroupNotice(groupID, notice) {
        await updateGroupProfile(groupID, {notice});
        const currentGroupData = await queryGroupDataByGroupID(groupID);
        return {
            group: convertGroup(currentGroupData)
        };
    };

    /**
     * Update group member alias
     * @param {string} groupID
     * @param {string} userID
     * @param {string} alias
     * @returns {Promise<void>}
     */
    async updateGroupMemberAlias(groupID, userID, alias) {
        try {
            const member = await MemberModel.findOneAndUpdate({groupID, userID}, {
                $set: {alias}
            }).lean();
            if (!member) {
                throw new TError(FAIL, "Sorry, this member is not exist or group is dismiss");
            }
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    /**
     * Query group list by userID
     * @param {string} userID
     * @returns {Promise<Array>}
     */
    async queryGroupList(userID) {
        const groups = await queryGroupList(userID);
        const groupsPromises = groups.map(group => {
            return queryGroupByID(group.groupID);
        });
        const membersPromises = groups.map(group => {
            return queryGroupMembers(group.groupID);
        });
        const groupsData = await Promise.all(groupsPromises);
        const membersData = await Promise.all(membersPromises);
        return convertGroupList(convertGroupListData(groupsData), convertGroupMembersList(membersData));
    };

    /**
     * Query group member by groupID and memberID
     * @param {string} groupID
     * @param {string} memberID
     * @returns {Promise<Object>}
     */
    async queryMemberByGroupIDAndMemberID({groupID, memberID}) {
        const member = await MemberModel.findOne({groupID, userID: memberID})
            .populate("userID")
            .select('-_id')
            .lean()
            .exec()
            .catch(err => {
                throw new TError(SERVER_UNKNOW_ERROR, `Server error, query member data fail: ${err.message}`);
            });
        if (!member) {
            throw new TError(FAIL, 'Operation failure, this user is not in current group');
        }
        let _member = Object.assign({}, member);
        delete _member._id;
        delete _member.updateTime;
        delete _member.createTime;
        delete _member.groupID;
        _member.userProfile = convertUser(_member.userID);
        delete _member.userID;
        return _member;
    };
}

const queryGroupDataByGroupID = async groupID => {
    try {
        const result = await Promise.all([queryGroupByID(groupID), queryGroupMembers(groupID)]);
        let group = JSON.parse(JSON.stringify(result[0]))
        group["members"] = result[1];
        return group;
    } catch (err) {
        console.log(err);
        throw new TError(SERVER_UNKNOW_ERROR, err.message);
    }
};

const updateGroupProfile = async (groupID, opts) => {
    try {
        const group = await GroupModel.findOneAndUpdate({
            _id: groupID,
            status: true,
        }, {
            $set: opts
        }).lean();
        if (!group) {
            throw new TError(FAIL, `Current group is not exist, update group profile fail`);
        }
        return group;
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, err.message);
    }
};

const queryGroupList = async userID => {
    const groups = await MemberModel.find({userID: userID, status: 0})
        .select('groupID')
        .lean()
        .exec()
        .catch(err => {
            throw new Error(`Server error, query user's group fail: ${err.message}`);
        });
    return groups;
};

const queryGroupMembers = groupID => {
    return MemberModel.find({groupID: groupID})
        .populate("userID")
        .select('-_id')
        .lean()
        .exec()
        .catch(err => {
            throw new Error(`Server error, query group data fail: ${err.message}`);
        });
};

const countUserGroups = currentUserID => {
    return GroupModel.countDocuments({owner: currentUserID, status: true}).lean()
        .catch(err => {
            throw new Error(err.message);
        });
};

const isGroupCountOverflow = async currentUserID => {
    try {
        const groups = await countUserGroups(currentUserID);
        return (groups >= Constants.MAX_USER_GROUP_OWN_COUNT);
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, "Server unknow error, count user's groups fail");
    }
};

const queryGroupByID = async groupID => {
    try {
        const group = await GroupModel.findOne({_id: groupID, status: true}).lean();
        if (!group) {
            throw new TError(FAIL, "The group is not exist, please check your group id");
        } else {
            return group;
        }
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, err.message);
    }
};

const queryMembersByGroupID = async groupID => {
    const members = await MemberModel.find({groupID, status: 0})
        .populate("userID")
        .lean()
        .exec()
        .catch(err => {
            console.log('--QUERY MEMBERS ERROR--', err);
            throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, get group members fail');
        });
    if (!members.length) {
        throw new TError(FAIL, `The group is not exist, please check your group id`);
    } else {
        return members.filter(member => (member.userID !== null));
    }
};

const isGroupOwnerOrAdmin = (group, userID) => {
    return (group.owner.toString() === userID.toString()) ? true : false;
};

const isMemberExistedGroup = (groupMembers, targetUserID) => {
    let index = _.findIndex(groupMembers, o => {
        return _.toString(o.userID._id) === _.toString(targetUserID);
    });
    return (index > -1);
};

const checkTargetUserIsCurrentUser = (targetUserID, currentUserID) => {
    return targetUserID.toString() === currentUserID.toString();
};

const generateGroupObject = (currentUser, groupID, groupInfo) => {
    let group = {};
    let currentUserID = currentUser.userID;
    group._id = groupID;
    group.createBy = currentUserID;
    group.owner = currentUserID;
    group.name = groupInfo.name;
    return group;
};

const generateMembersObject = (groupID, members, currentUser) => {
    let _members = members.map(member => {
        return {groupID: groupID, userID: member};
    });
    if (currentUser) _members.unshift({groupID: groupID, userID: currentUser.userID});
    return _members;
};

const saveGroup = group => {
    try {
        return new GroupModel(group).save();
    } catch (err) {
        console.log('--[CREATE GROUP FAIL]--', err);
        throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, create group fail');
    }
};

const saveMembers = members => {
    try {
        return MemberModel.create(members);
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, `Server error, save group members fail: ${err}`);
    }
};

const addMemberToGroup = async (groupID, members) => {
    try {
        const result = await MemberModel.create(members);
        if (!result) {
            throw new Error('Current group is not exist, join group fail');
        }
        return result;
    } catch (err) {
        throw new Error(`Server error, join group fail, ${err.message}`);
    }
};

const joinToGroup = (groupID, member) => {
    try {
        const memberModel = new MemberModel({groupID, userID: member.userID});
        return memberModel.save();
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, add contact fail');
    }
};

const removeGroupMember = (groupID, targetUserID) => {
    try {
        return MemberModel.remove({groupID, userID: targetUserID});
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, err.message);
    }
};

const removeGroupMembers = groupID => {
    try {
        return MemberModel.remove({groupID});
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, err.message);
    }
};

const updateGroupOwner = (groupID, ownerUserID) => {
    try {
        return GroupModel.findOneAndUpdate({
            _id: groupID,
            status: true,
        }, {
            $set: {
                owner: ownerUserID,
            }
        }).lean();
    } catch (err) {
        throw new Error('Server unknow error, update group owner fail');
    }
};

const dismissGroup = async groupID => {
    try {
        await removeGroup(groupID);
        await removeGroupMembers(groupID);
    } catch (err) {
        console.log(err);
        throw new TError(SERVER_UNKNOW_ERROR, `Server error, ${err.message}`);
    }
};

const removeGroup = groupID => {
    try {
        return GroupModel.findOneAndUpdate({
            _id: groupID,
            status: true,
        }, {
            $set: {
                status: false,
            }
        }).lean();
    } catch (error) {
        throw new TError(SERVER_UNKNOW_ERROR, error.message);
    }
};

// data convert opertaion
const removeDuplicate = (orgMembers, newMembers) => {
    for (let i = 0; i < newMembers.length; i++) {
        let member = newMembers[i];
        let index = _.findIndex(orgMembers, o => {
            return o.userID.toString() == member.userID.toString();
        });
        if (index > -1) continue;
        orgMembers.push(member);
    }
};

const convertGroup = group => {
    let _group = Object.assign({}, group);
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;
    convertGroupMembers(_group.members);
    return _group;
};

const convertGroupMembers = members => {
    return members.filter(member => {
        return member.userID != null;
    }).map(member => {
        delete member._id;
        delete member.updateTime;
        delete member.createTime;
        delete member.groupID;
        member.userProfile = convertUser(member.userID);
        delete member.userID;

        return member;
    })
};

const convertGroupMembersList = members => {
    return members.map(member => {
        return convertGroupMembers(JSON.parse(JSON.stringify(member)));
    });
};

const convertGroupList = (groups, members) => {
    let _groups = [];
    for (let i = 0; i < groups.length; i++) {
        let group = {};
        group = groups[i];
        group.members = members[i];

        _groups.push(group);
    }
    return _groups;
};

const convertGroupData = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    return _group;
};

const convertGroupListData = groups => {
    return groups.map(group => {
        return convertGroupData(group);
    })
};


const convertUser = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    delete _user.deviceID;
    return _user;
};

module.exports = new GroupRepository();
