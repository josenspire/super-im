const _ = require("lodash");
const GroupModel = require("../models/group.server.model");
const Constants = require("../utils/Constants");
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");


exports.createGroup = async (currentUser, groupInfo, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let isGroupOverflow = await isGroupCountOverflow(currentUser.userID);
        if (isGroupOverflow) {
            result.message = `Current user's group count is out of max user group count limit (${Constants.MAX_USER_GROUP_OWN_COUNT})`;
        } else {
            let group = generateGroupObject(currentUser, groupInfo);
            let _group = await saveGroup(group);
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
        let group = await queryGroupByID(groupID);
        if (group && (group.members.length + members.length) > Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT) {
            result.message = `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`;
            result.status = FAIL;
        } else {
            let _group = await addMemberToGroup(groupID, members);
            result.data.group = convertGroup(_group);
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
        let group = await queryGroupByID(groupID);
        if (isMemberExistedGroup(group, member.userID)) {
            result.message = "You are currently group member, please do not repeat";
        } else {
            if (group && (group.members.length >= Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT)) {
                result.message = `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`;
            } else {
                let _group = await joinToGroup(groupID, member);
                result.data.group = convertGroup(_group);
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
        if (checkTargetUserIsCurrentUser(targetUserID, group.owner)) {
            result.message = "You can't kick your self as a member";
        } else if (!isGroupOwnerOrAdmin(group, currentUser.userID)) {
            result.message = "You do not have the right to do this";
        } else {
            if (!isMemberExistedGroup(group, targetUserID)) {
                result.message = "This user is not in current group";
            } else {
                let _group = await removeGroupMember(groupID, targetUserID);
                result.data.group = convertGroup(_group);
                result.status = SUCCESS;
            }
        }
    } catch (err) {
        console.log("---[KICK GROUP MEMBER ERROR]---", err)
        result.message = err;
    }
    cb(result);
}

exports.quitGroup = async (userID, groupID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let group = await queryGroupByID(groupID);

        if (!isMemberExistedGroup(group, userID)) {
            result.message = "You are not in current group";
        } else {
            let _group = await removeGroupMember(groupID, userID);
            if (checkTargetUserIsCurrentUser(userID, group.owner)) {
                // Default make secondly members as owner
                updateGroupOwner(groupID, group.members[1].userID);
            }
            result.data.group = convertGroup(_group);
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
            let _group = await dismissGroup(groupID);
            result.data.group = convertGroup(_group);
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
        result.data = convertGroup(group);
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
        result.data = convertGroup(group);
        result.status = SUCCESS;
    } catch (err) {
        result.message = err;
    }
    cb(result);
}

exports.updateGroupMemberAlias = async (groupID, userID, alias, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let group = await updateGroupMemberAlias(groupID, userID, alias);
        result.data.group = convertGroup(group);
        result.status = SUCCESS;
    } catch (err) {
        result.message = err;
    }
    cb(result);
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
        GroupModel.findOne({ _id: groupID }, (err, group) => {
            if (err) return reject(err.message);
            if (!group) return reject(`Current group is not exist, update group profile fail`);

            let isModified = false;
            let members = group.members;
            for (let i = 0; i < members.length; i++) {
                if (members[i].userID.toString() === userID.toString()) {
                    isModified = true;
                    members[i].alias = alias;
                    group.markModified('alias');
                    group.save((err, newGroup) => {
                        if (err) return reject("Server unknow error, update alias fail")
                        resolve(newGroup);
                    });
                    break;
                }
            }
            if (!isModified) return reject("You are not in current group");
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

var isGroupOwnerOrAdmin = (group, userID) => {
    return (group.owner.toString() === userID.toString()) ? true : false;
}

var isMemberExistedGroup = (group, targetUserID) => {
    let members = group.members;
    let index = _.findIndex(members, o => { return o.userID.toString() === targetUserID.toString(); });

    return (index > -1);
}

var checkTargetUserIsCurrentUser = (targetUserID, currentUserID) => {
    return targetUserID.toString() === currentUserID.toString();
}

var generateGroupObject = (currentUser, groupInfo) => {
    let group = {};
    let currentUserID = currentUser.userID;
    let members = groupInfo.members;
    members.unshift({ userID: currentUserID, alias: currentUser.nickname });

    group.createBy = currentUserID;
    group.owner = currentUserID;
    group.name = groupInfo.name;
    group.members = members;

    return group;
}

var saveGroup = (group) => {
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

var addMemberToGroup = (groupID, members) => {
    return new Promise((resolve, reject) => {
        GroupModel.findOne({ _id: groupID, status: true }, (err, group) => {
            if (err) {
                reject('Server unknow error, join group fail');
            } else if (!group) {
                reject('Current group is not exist, join group fail');
            } else {
                removeDuplicate(group.members, members);
                group.markModified('members');
                group.save((err, newGroup) => {
                    if (err) {
                        console.log(err.message)
                        reject('Server unknow error, join group fail');
                    }
                    else resolve(newGroup);
                });
            }
        });
    })
}

var joinToGroup = (groupID, member) => {
    return new Promise((resolve, reject) => {
        GroupModel.findOneAndUpdate({ _id: groupID, status: true }, { $addToSet: { members: member } }, (err, result) => {
            if (err) {
                reject('Server unknow error, add contact fail');
            } else if (result) {
                resolve(result);
            } else {
                reject('Current user is not exist, add contact fail');
            }
        })
    })
}

var removeGroupMember = (groupID, targetUserID) => {
    return new Promise((resolve, reject) => {
        GroupModel.findOneAndUpdate({ _id: groupID, status: true }, { $pull: { members: { userID: targetUserID } } }, (err, result) => {
            if (err) {
                reject('Server unknow error, delete contact fail');
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

var dismissGroup = groupID => {
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

    _group.members = convertGourpMembers(_group.members);
    return _group;
}

var convertGourpMembers = members => {
    let _members = JSON.parse(JSON.stringify(members));
    return _members.map(member => {
        delete member._id;
        return member;
    })
}