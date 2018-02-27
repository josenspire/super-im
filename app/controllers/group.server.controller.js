const GroupService = require("../services/group.server.service");
const StringUtil = require("../utils/StringUtil");
const Constants = require("../utils/Constants");
const { SUCCESS, FAIL } = require("../utils/CodeConstants");

exports.createGroup = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    let name = StringUtil.stringSubstr(input.name, Constants.GROUP_NAME_MAX_LENGTH);
    let members = input.members;

    if (members.length < 2) {
        return res.json({
            status: FAIL,
            data: {},
            message: "Group's member count should be greater than 1 at least"
        })
    };
    if (members.length > 500) {
        return res.json({
            status: FAIL,
            data: {},
            message: `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`
        })
    }
    let groupInfo = {
        name: name,
        members: members
    };
    GroupService.createGroup(currentUser, groupInfo, result => {
        return res.json(result)
    });
}

exports.addGroupMembers = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.addGroupMembers(currentUser, input.groupID, input.members, result => {
        return res.json(result);
    });
}

exports.joinGroup = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.joinGroup(currentUser, input.groupID, result => {
        return res.json(result);
    });
}

exports.kickGroupMember = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.kickGroupMember(currentUser, input.groupID, input.targetUserID, result => {
        return res.json(result);
    });
}

exports.quitGroup = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.quitGroup(currentUser, input.groupID, result => {
        return res.json(result);
    });
}

exports.dismissGroup = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.dismissGroup(currentUser, input.groupID, result => {
        return res.json(result);
    });
}

exports.renameGroup = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.renameGroup(currentUser, input.groupID, input.name, result => {
        return res.json(result);
    });
}

exports.updateGroupNotice = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    if (input.notice.length > 100) {
        return res.json({
            status: FAIL,
            data: {},
            message: `Group's notice is out of max length limit (${Constants.GROUP_NOTICE_MAX_LENGTH})`
        })
    }
    GroupService.updateGroupNotice(currentUser, input.groupID, input.notice, result => {
        return res.json(result);
    });
}

exports.updateGroupMemberAlias = (req, res, next) => {
    let input = req.data.input || {};
    let currentUser = req.data.user;

    GroupService.updateGroupMemberAlias(currentUser, input.groupID, input.alias, result => {
        return res.json(result);
    });
}

exports.getGroupList = (req, res, next) => {
    let input = req.data.input || {};

    GroupService.getGroupList(input.userID, result => {
        return res.json(result);
    });
}