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

exports.joinGroup = async (groupID, members, cb) => {
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
        console.log("---[JOIN GROUP ERROR]---", err)
        result.message = err;
    }
    cb(result);
}

var countUserGroups = currentUserID => {
    return new Promise((resolve, reject) => {
        GroupModel.count({ owner: currentUserID }, (err, count) => {
            if (err) {
                reject(err);
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
        GroupModel.findOne({ _id: groupID }, (err, group) => {
            if (err) {
                reject(err);
            } else {
                resolve(group);
            }
        })
    })
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
        GroupModel.findOne({ _id: groupID }, (err, group) => {
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

var removeDuplicate = (orgMembers, newMembers) => {
    for (let i = 0; i < newMembers.length; i++) {
        let member = newMembers[i];
        let index = _.findIndex(orgMembers, o => { return o.userID == member.userID; });
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