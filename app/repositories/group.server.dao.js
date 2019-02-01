const _ = require("lodash");
const mongoose = require('mongoose')

const GroupModel = require("../models/group.server.model");
const MemberModel = require("../models/member.server.model");

const Constants = require("../utils/Constants");
const {SUCCESS, FAIL} = require("../utils/CodeConstants");

class GroupRepository {
    /**
     * Create a user contact group
     * @param {Object} currentUser
     * @param {Object} groupInfo
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async createGroup(currentUser, groupInfo) {
        let result = {status: FAIL, data: {}, message: ""};
        const groupID = mongoose.Types.ObjectId();

        try {
            const isGroupOverflow = await isGroupCountOverflow(currentUser.userID);
            if (isGroupOverflow) {
                result.message = `Current user's group count is out of max user group count limit (${Constants.MAX_USER_GROUP_OWN_COUNT})`;
            } else {
                let group = generateGroupObject(currentUser, groupID, groupInfo);
                let members = generateMembersObject(groupID, groupInfo.members, currentUser);

                let _group = JSON.parse(JSON.stringify(await saveGroup(group)));
                await saveMembers(members);
                _group.members = await queryMembersByGroupID(groupID);

                result.data.group = convertGroup(_group);
                result.status = SUCCESS;
            }
        } catch (err) {
            console.log("---[CREATE GROUP ERROR]---", err)
            result.message = err;
        }
        return result;
    };

    /**
     * Add members to group
     * @param {string} groupID
     * @param {Array} members
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async addGroupMembers(groupID, members) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            let groupMembers = await queryMembersByGroupID(groupID);
            // TODO: need to check group is existed ?
            if ((groupMembers.length + members.length) > Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT) {
                result.message = `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`;
                result.status = FAIL;
            } else {
                const membersObject = generateMembersObject(groupID, members);
                await addMemberToGroup(groupID, membersObject);
                // TODO
                // need to check and remove dulplicate members
                let group = await queryGroupDataByGroupID(groupID);
                result.data.group = convertGroup(group);
                result.status = SUCCESS;
            }
        } catch (err) {
            console.log("---[ADD GROUP ERROR]---", err)
            result.message = err;
        }
        return result;
    }

    /**
     * Join to one group
     * @param {Object} member
     * @param {string} groupID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async joinGroup(member, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            // TODO 
            // need to check group is existed ?
            const groupMembers = await queryMembersByGroupID(groupID);
            if (isMemberExistedGroup(groupMembers, member.userID)) {
                result.message = "You are currently group member, please do not repeat";
            } else {
                if ((groupMembers.length >= Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT)) {
                    result.message = `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`;
                } else {
                    await joinToGroup(groupID, member);

                    let currentGroupData = await queryGroupDataByGroupID(groupID);
                    result.data.group = convertGroup(currentGroupData);
                    result.status = SUCCESS;
                }
            }
        } catch (err) {
            console.log("---[JOIN GROUP ERROR]---", err)
            result.message = err;
        }
        return result;
    };

    /**
     * Kick a group member
     * @param {Object} currentUser
     * @param {string} groupID
     * @param {string} targetUserID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async kickGroupMember(currentUser, groupID, targetUserID) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const group = await queryGroupByID(groupID);
            let groupMembers = await queryMembersByGroupID(groupID);
            if (checkTargetUserIsCurrentUser(targetUserID, group.owner)) {
                result.message = "You can't kick your self as a member";
            } else if (!isGroupOwnerOrAdmin(group, currentUser.userID)) {
                result.message = "You do not have the right to do this";
            } else {
                if (!isMemberExistedGroup(groupMembers, targetUserID)) {
                    result.message = "This user is not in current group";
                } else {
                    await removeGroupMember(groupID, targetUserID);

                    let currentGroupData = await queryGroupDataByGroupID(groupID);
                    result.data.group = convertGroup(currentGroupData);
                    result.status = SUCCESS;
                }
            }
        } catch (err) {
            console.log("---[KICK GROUP MEMBER ERROR]---", err)
            result.message = err;
        }
        return result;
    };

    /**
     * Quit group
     * @param {string} currentUserID
     * @param {string} groupID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async quitGroup(currentUserID, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const group = await queryGroupByID(groupID);
            const groupMembers = await queryMembersByGroupID(groupID);

            if (!isMemberExistedGroup(groupMembers, currentUserID)) {
                result.message = "You are not in current group";
            } else {
                if (groupMembers.length <= 1) {
                    // If members less than 1, group will dismiss
                    await dismissGroup(groupID);
                    result.data = {
                        isDismiss: true,
                    };
                } else {
                    await removeGroupMember(groupID, currentUserID);
                    if (isGroupOwnerOrAdmin(group, currentUserID)) {
                        // Default make secondly members as owner
                        updateGroupOwner(groupID, groupMembers[1].userID._id);
                    }
                    let currentGroupData = await queryGroupDataByGroupID(groupID);
                    result.data = {
                        group: convertGroup(currentGroupData),
                        isDismiss: false,
                    };
                }
                result.status = SUCCESS;
            }
        } catch (err) {
            console.log("---[QUIT GROUP ERROR]---", err)
            result.status = FAIL;
            result.message = err;
            result.data = {};
        }
        return result;
    }

    /**
     * Dismiss use's group
     * @param {string} userID
     * @param {string} groupID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async dismissGroup(userID, groupID) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const group = await queryGroupByID(groupID);
            if (!isGroupOwnerOrAdmin(group, userID)) {
                result.message = "You do not have the right to do this";
            } else {
                await dismissGroup(groupID);
                let currentGroupData = await queryGroupDataByGroupID(groupID);
                result.data.group = convertGroup(currentGroupData);
                result.status = SUCCESS;
            }
        } catch (err) {
            console.log("---[DISMISS GROUP ERROR]---", err)
            result.message = err;
        }
        return result;
    };

    /**
     * Rename group name
     * @param {string} groupID
     * @param {string} name
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async renameGroup(groupID, name) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            await updateGroupProfile(groupID, {name});
            let currentGroupData = await queryGroupDataByGroupID(groupID);
            result.data.group = convertGroup(currentGroupData);
            result.status = SUCCESS;
        } catch (err) {
            result.message = err;
        }
        return result;
    };

    /**
     * Update group notice information
     * @param {string} groupID
     * @param {string} notice
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async updateGroupNotice(groupID, notice) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            await updateGroupProfile(groupID, {notice});
            let currentGroupData = await queryGroupDataByGroupID(groupID);
            result.data.group = convertGroup(currentGroupData);
            result.status = SUCCESS;
        } catch (err) {
            result.message = err;
        }
        return result;
    };

    /**
     * Update group member alias
     * @param {string} groupID
     * @param {string} userID
     * @param {string} alias
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async updateGroupMemberAlias(groupID, userID, alias) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            await updateGroupMemberAlias(groupID, userID, alias);
            result.status = SUCCESS;
        } catch (err) {
            result.message = err;
        }
        return result;
    }

    /**
     * Query group list by userID
     * @param {string} userID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async queryGroupList(userID) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const groupData = await queryUserAllGroupListData(userID);
            result.data.groups = groupData;
            result.status = SUCCESS;
        } catch (err) {
            result.message = err.message;
        }
        return result;
    };

    /**
     * Query group member by groupID and memberID
     * @param {string} groupID
     * @param {string} memberID
     * @returns {Promise<*>}
     */
    async queryMemberByGroupIDAndMemberID({groupID, memberID}) {
        const member = await MemberModel.findOne({groupID, userID: memberID})
            .populate("userID")
            .select('-_id')
            .exec()
            .catch(err => {
                throw new Error(`Server error, query member data fail: ${err.message}`);
            });
        if (!member) {
            return resolve(null);
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
};

var queryUserAllGroupListData = async userID => {
    try {
        const groups = await queryGroupList(userID);
        const groupsPromises = groups.map(group => {
            return queryGroupByID(group.groupID);
        });
        const membersPromises = groups.map(group => {
            return queryGroupMembers(group.groupID);
        });
        let groupsData = await Promise.all(groupsPromises);
        let membersData = await Promise.all(membersPromises);
        return convertGroupList(convertGroupListData(groupsData), convertGroupMembersList(membersData));
    } catch (err) {
        throw new Error(err);
    }
};

var queryGroupDataByGroupID = async groupID => {
    try {
        const result = await Promise.all([queryGroupByID(groupID), queryGroupMembers(groupID)]);
        let group = {};
        group = JSON.parse(JSON.stringify(result[0]));
        group.members = result[1];
        return group;
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
};

var updateGroupProfile = async (groupID, opts) => {
    try {
        const group = await GroupModel.findOneAndUpdate({_id: groupID, status: true}, {$set: opts}).lean();
        if (!group) {
            throw new Error(`Current group is not exist, update group profile fail`);
        }
        return group;
    } catch (err) {
        throw new Error(err.message);
    }
};

var updateGroupMemberAlias = async (groupID, userID, alias) => {
    try {
        const member = await MemberModel.findOneAndUpdate({groupID, userID}, {
            $set: {alias}
        }).lean();
        if (!member) {
            throw new Error("Sorry, this member is not exist or group is dismiss");
        }
        return member;
    } catch (err) {
        throw new Error(err.message);
    }
};

var queryGroupList = async userID => {
    const groups = await MemberModel.find({userID: userID, status: 0})
        .select('groupID')
        .exec()
        .catch(err => {
            throw new Error(`Server error, query user's group fail: ${err.message}`);
        });
    return groups;
};

var queryGroupMembers = groupID => {
    return MemberModel.find({groupID: groupID})
        .populate("userID")
        .select('-_id')
        .exec()
        .catch(err => {
            throw new Error(`Server error, query group data fail: ${err.message}`);
        });
};

var countUserGroups = currentUserID => {
    return GroupModel.count({owner: currentUserID, status: true}).lean()
        .catch(err => {
            throw new Error(err.message);
        });
};

var isGroupCountOverflow = async currentUserID => {
    try {
        const groups = await countUserGroups(currentUserID);
        return (groups >= Constants.MAX_USER_GROUP_OWN_COUNT);
    } catch (err) {
        throw new Error("Error: count user's groups fail");
    }
};

var queryGroupByID = async groupID => {
    try {
        const group = await GroupModel.findOne({_id: groupID, status: true}).lean();
        if (!group) {
            throw new Error("The group is not exist, please check your group id");
        } else {
            return group;
        }
    } catch (err) {
        throw new Error(err.message);
    }
};

var queryMembersByGroupID = async groupID => {
    const members = await MemberModel.find({groupID: groupID, status: 0}).populate("userID").exec()
        .catch(err => {
            console.log('--QUERY MEMBERS ERROR--', err);
            throw new Error(err.message);
        });
    if (!members) {
        throw new Error(`The group is not exist, please check your group id`);
    } else {
        return members.filter(member => (member.userID !== null));
    }
};

var isGroupOwnerOrAdmin = (group, userID) => {
    return (group.owner.toString() === userID.toString()) ? true : false;
};

var isMemberExistedGroup = (groupMembers, targetUserID) => {
    let index = _.findIndex(groupMembers, o => {
        return _.toString(o.userID._id) === _.toString(targetUserID);
    });
    return (index > -1);
};

var checkTargetUserIsCurrentUser = (targetUserID, currentUserID) => {
    return targetUserID.toString() === currentUserID.toString();
};

var generateGroupObject = (currentUser, groupID, groupInfo) => {
    let group = {};
    let currentUserID = currentUser.userID;
    group._id = groupID;
    group.createBy = currentUserID;
    group.owner = currentUserID;
    group.name = groupInfo.name;
    return group;
};

var generateMembersObject = (groupID, members, currentUser) => {
    let _members = members.map(member => {
        return {groupID: groupID, userID: member};
    });
    if (currentUser) _members.unshift({groupID: groupID, userID: currentUser.userID});
    return _members;
};

var saveGroup = group => {
    const groupModel = new GroupModel(group);
    try {
        return groupModel.save();
    } catch (err) {
        console.log('--[CREATE GROUP FAIL]--', err);
        throw new Error('Server unknow error, create group fail');
    }
};

var saveMembers = members => {
    try {
        return MemberModel.create(members).lean();
    } catch (err) {
        throw new Error(`Server error, save group members fail: ${err}`);
    }
};

var addMemberToGroup = async (groupID, members) => {
    try {
        const result = await MemberModel.create(members).lean();
        if (!result) {
            throw new Error('Current group is not exist, join group fail');
        }
        return result;
    } catch (err) {
        throw new Error(`Server error, join group fail, ${err.message}`);
    }
};

var joinToGroup = (groupID, member) => {
    try {
        const memberModel = new MemberModel({groupID, userID: member.userID});
        return memberModel.save();
    } catch (err) {
        throw new Error('Server unknow error, add contact fail');
    }
};

var removeGroupMember = (groupID, targetUserID) => {
    return MemberModel.remove({groupID, userID: targetUserID});
};

var removeGroupMembers = groupID => {
    return MemberModel.remove({groupID});
};

var updateGroupOwner = (groupID, ownerUserID) => {
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

var dismissGroup = async groupID => {
    try {
        await removeGroup(groupID);
        await removeGroupMembers(groupID);
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
};

var removeGroup = groupID => {
    try {
        return GroupModel.findOneAndUpdate({_id: groupID, status: true}, {$set: {status: false}});
    } catch (error) {
        throw new Error(err.message);
    }
};

// data convert opertaion
var removeDuplicate = (orgMembers, newMembers) => {
    for (let i = 0; i < newMembers.length; i++) {
        let member = newMembers[i];
        let index = _.findIndex(orgMembers, o => {
            return o.userID.toString() == member.userID.toString();
        });
        if (index > -1) continue;
        orgMembers.push(member);
    }
};

var convertGroup = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    convertGroupMembers(_group.members);
    return _group;
};

var convertGroupMembers = members => {
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

var convertGroupMembersList = members => {
    return members.map(member => {
        let _member = convertGroupMembers(JSON.parse(JSON.stringify(member)));
        return _member;
    });
}

var convertGroupList = (groups, members) => {
    let _groups = [];
    for (let i = 0; i < groups.length; i++) {
        let group = {};
        group = groups[i];
        group.members = members[i];

        _groups.push(group);
    }
    return _groups;
};

var convertGroupData = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    return _group;
};

var convertGroupListData = groups => {
    return groups.map(group => {
        return convertGroupData(group);
    })
}


var convertUser = user => {
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
