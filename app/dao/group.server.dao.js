const _ = require("lodash");
const mongoose = require('mongoose')

const GroupModel = require("../models/group.server.model");
const MemberModel = require("../models/member.server.model");

const Constants = require("../utils/Constants");
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

exports.createGroup = async (currentUser, groupInfo, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    let groupID = mongoose.Types.ObjectId();

    try {
        let isGroupOverflow = await isGroupCountOverflow(currentUser.userID);
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
    cb(result);
};

exports.addGroupMembers = async (groupID, members, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let groupMembers = await queryMembersByGroupID(groupID);
        // TODO 
        // need to check group is existed ?
        if ((groupMembers.length + members.length) > Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT) {
            result.message = `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`;
            result.status = FAIL;
        } else {
            let membersObject = generateMembersObject(groupID, members);
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
    cb(result);
}

exports.joinGroup = async (member, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        // TODO 
        // need to check group is existed ?
        let groupMembers = await queryMembersByGroupID(groupID);
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
    cb(result);
}

exports.kickGroupMember = async (currentUser, groupID, targetUserID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let group = await queryGroupByID(groupID);
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
    cb(result);
}

exports.quitGroup = async (currentUserID, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let group = await queryGroupByID(groupID);
        let groupMembers = await queryMembersByGroupID(groupID);

        if (!isMemberExistedGroup(groupMembers, currentUserID)) {
            result.message = "You are not in current group";
        } else {
            if (groupMembers.length <= 1) {
                // If members less than 1, group will dismiss
                await dismissGroup(groupID);
                result.message = "Group member less than 1, this group is dismissed";
            } else {
                await removeGroupMember(groupID, currentUserID);
                if (isGroupOwnerOrAdmin(group, currentUserID)) {
                    // Default make secondly members as owner
                    updateGroupOwner(groupID, groupMembers[1].userID._id);
                }
            }
            let currentGroupData = await queryGroupDataByGroupID(groupID);
            result.data.group = convertGroup(currentGroupData);
            result.status = SUCCESS;
        }
    } catch (err) {
        console.log("---[QUIT GROUP ERROR]---", err)
        result.message = err;
    }
    cb(result);
}

exports.dismissGroup = async (userID, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let group = await queryGroupByID(groupID);

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
    cb(result);
}

exports.renameGroup = async (groupID, name, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let opts = { name: name };
        await updateGroupProfile(groupID, opts);
        let group = await queryGroupByID(groupID);
        result.data.group = convertGroupData(group);
        result.status = SUCCESS;
    } catch (err) {
        result.message = err;
    }
    cb(result);
}

exports.updateGroupNotice = async (groupID, notice, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let opts = { notice: notice };
        await updateGroupProfile(groupID, opts);
        let group = await queryGroupByID(groupID);
        result.data = convertGroupData(group);
        result.status = SUCCESS;
    } catch (err) {
        result.message = err;
    }
    cb(result);
}

exports.updateGroupMemberAlias = async (groupID, userID, alias, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        await updateGroupMemberAlias(groupID, userID, alias);
        result.status = SUCCESS;
    } catch (err) {
        result.message = err;
    }
    cb(result);
}

exports.queryGroupList = (userID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    queryUserAllGroupListData(userID)
        .then(data => {
            result.data.groups = data;
            result.status = SUCCESS;
            cb(result);
        })
        .catch(err => {
            result.message = err;
            cb(result);
        })
}

var queryUserAllGroupListData = userID => {
    return new Promise(async (resolve, reject) => {
        try {
            let groups = await queryGroupList(userID);

            let groupsPromises = groups.map(group => {
                return queryGroupByID(group.groupID);
            });
            let membersPromises = groups.map(group => {
                return queryGroupMembers(group.groupID);
            });

            let groupsData = await Promise.all(groupsPromises);
            let membersData = await Promise.all(membersPromises);

            let _data = convertGroupList(convertGroupListData(groupsData), convertGroupMembersList(membersData));
            resolve(_data);
        } catch (err) {
            reject(err);
        }
    });
}

var queryGroupDataByGroupID = groupID => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await Promise.all([queryGroupByID(groupID), queryGroupMembers(groupID)]);
            let group = {};
            group = JSON.parse(JSON.stringify(result[0]));
            group.members = result[1];
            resolve(group);
        } catch (err) {
            reject(err.message);
        }
    })
}

var updateGroupProfile = (groupID, opts) => {
    return new Promise((resolve, reject) => {
        GroupModel.findOneAndUpdate({ _id: groupID, status: true }, { $set: opts }, async (err, group) => {
            if (err) return reject(err.message);
            if (!group) return reject(`Current group is not exist, update group profile fail`);

            resolve();
        });
    })
}

var updateGroupMemberAlias = (groupID, userID, alias) => {
    return new Promise(async (resolve, reject) => {
        MemberModel.findOneAndUpdate({ groupID: groupID, userID: userID }, { $set: { alias: alias } }, (err, member) => {
            if (err) return reject(err.message);
            if (!member) return reject("Sorry, this member is not exist or group is dismiss");
            resolve();
        })
    })
}

var queryGroupList = userID => {
    return new Promise((resolve, reject) => {
        MemberModel.find({ userID: userID, status: 0 })
            // .populate('groupID')
            .select('groupID')
            .exec((err, groups) => {
                if (err) {
                    reject(`Server error, query user's group fail: ${err.message}`);
                } else {
                    resolve(groups);
                }
            })
        // MemberModel.aggregate([
        //     {
        //         $group: {
        //             _id: { userID: "$userID" }
        //         },
        //     },
        //     // { $match: { userID: userID } }
        // ]).exec((err, groups) => {
        //     if (err) {
        //         reject(`Server error, Query user's group fail: ${err.message}`);
        //     } else {
        //         resolve(groups);
        //     }
        // })
    })
}

var queryGroupMembers = groupID => {
    return new Promise((resolve, reject) => {
        MemberModel.find({ groupID: groupID })
            // .populate("groupID")
            .populate("userID")
            .select('-_id')
            .exec((err, members) => {
                if (err) return reject(`Server error, query group data fail: ${err.message}`);
                resolve(members);
            })
    })
}

var countUserGroups = currentUserID => {
    return new Promise((resolve, reject) => {
        GroupModel.count({ owner: currentUserID, status: true }, (err, count) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(count);
            }
        })
    })
}

var isGroupCountOverflow = async currentUserID => {
    try {
        let groups = await countUserGroups(currentUserID);
        return (groups >= Constants.MAX_USER_GROUP_OWN_COUNT);
    } catch (err) {
        throw new Error("Error: count user's groups fail");
    }
}

var queryGroupByID = groupID => {
    return new Promise((resolve, reject) => {
        GroupModel.findOne({ _id: groupID, status: true }, (err, group) => {
            if (err) {
                reject(err.message);
            } else if (!group) {
                reject("The group is not exist, please check your group id");
            } else {
                resolve(group);
            }
        })
    })
}

var queryMembersByGroupID = groupID => {
    return new Promise((resolve, reject) => {
        MemberModel.find({ groupID: groupID, status: 0 })
            .populate("userID")
            .exec((err, members) => {
                if (err) {
                    reject(err.message);
                } else if (!members) {
                    reject("The group is not exist, please check your group id");
                } else {
                    resolve(members.filter(member => { return member.userID != null }));
                }
            });
    })
}

var isGroupOwnerOrAdmin = (group, userID) => {
    return (group.owner.toString() === userID.toString()) ? true : false;
}

var isMemberExistedGroup = (groupMembers, targetUserID) => {
    let index = _.findIndex(groupMembers, o => {
        return _.toString(o.userID._id) === _.toString(targetUserID);
    });
    return (index > -1);
}

var checkTargetUserIsCurrentUser = (targetUserID, currentUserID) => {
    return targetUserID.toString() === currentUserID.toString();
}

var generateGroupObject = (currentUser, groupID, groupInfo) => {
    let group = {};
    let currentUserID = currentUser.userID;
    // let members = groupInfo.members;
    // members.unshift({ userID: currentUserID, alias: currentUser.nickname });

    group._id = groupID;
    group.createBy = currentUserID;
    group.owner = currentUserID;
    group.name = groupInfo.name;
    // group.members = members;

    return group;
}

var generateMembersObject = (groupID, members, currentUser) => {
    let _members = members.map(member => {
        return { groupID: groupID, userID: member };
    });
    if (currentUser) _members.unshift({ groupID: groupID, userID: currentUser.userID });

    return _members;
}

var saveGroup = group => {
    let groupModel = new GroupModel(group);
    return new Promise((resolve, reject) => {
        groupModel.save((err, data) => {
            if (err) {
                console.log('--[CREATE GROUP FAIL]--', err);
                reject('Server unknow error, create group fail')
            } else {
                resolve(data);
            }
        })
    })
}

var saveMembers = members => {
    return new Promise((resolve, reject) => {
        MemberModel.create(members, (err, result) => {
            if (err) {
                console.log('--[SAVE GROUP MEMBER FAIL]--', err);
                reject(`Server error, save group members fail: ${err}`)
            } else {
                resolve(result);
            }
        })
    })
}

var addMemberToGroup = (groupID, members) => {
    return new Promise((resolve, reject) => {
        MemberModel.create(members, (err, result) => {
            if (err) {
                reject(`Server error, join group fail, ${err.message}`);
            } else if (!result) {
                reject('Current group is not exist, join group fail');
            } else {
                resolve();
            }
        });
    })
}

var joinToGroup = (groupID, member) => {
    return new Promise((resolve, reject) => {
        let memberModel = new MemberModel({ groupID: groupID, userID: member.userID });
        memberModel.save((err, result) => {
            if (err) return reject('Server unknow error, add contact fail');
            resolve();
        })
    })
}

var removeGroupMember = (groupID, targetUserID) => {
    return new Promise((resolve, reject) => {
        MemberModel.remove({ groupID: groupID, userID: targetUserID }, (err, result) => {
            if (err) {
                reject('Server unknow error, delete contact fail');
            } else {
                resolve();
            }
        })
    })
}

var removeGroupMembers = groupID => {
    return new Promise((resolve, reject) => {
        MemberModel.remove({ groupID: groupID }, (err, result) => {
            if (err) {
                reject('Server unknow error, dismiss group fail');
            } else {
                resolve(result);
            }
        })
    })
}

var updateGroupOwner = (groupID, ownerUserID) => {
    return new Promise((resolve, reject) => {
        GroupModel.findOneAndUpdate({ _id: groupID, status: true }, { $set: { owner: ownerUserID } }, (err, result) => {
            if (err) {
                reject('Server unknow error, update group owner fail');
            } else {
                resolve(result);
            }
        })
    })
}

var dismissGroup = async groupID => {
    await removeGroup(groupID);
    await removeGroupMembers(groupID);
}

var removeGroup = groupID => {
    return new Promise((resolve, reject) => {
        GroupModel.findOneAndUpdate({ _id: groupID, status: true }, { $set: { status: false } }, (err, result) => {
            if (err) {
                reject('Server unknow error, dismiss group fail');
            } else {
                resolve(result);
            }
        })
    })
}

// data convert opertaion
var removeDuplicate = (orgMembers, newMembers) => {
    for (let i = 0; i < newMembers.length; i++) {
        let member = newMembers[i];
        let index = _.findIndex(orgMembers, o => { return o.userID.toString() == member.userID.toString(); });
        if (index > -1) continue;
        orgMembers.push(member);
    }
}

var convertGroup = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    convertGroupMembers(_group.members);
    return _group;
}

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
}

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
}

var convertGroupData = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    return _group;
}

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
}