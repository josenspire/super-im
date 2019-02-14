const _ = require('lodash');
const GroupService = require("../services/group.service");
const {stringSubstr} = require("../utils/StringUtil");
const Constants = require("../utils/Constants");
const {FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const {success, fail, error} = require('../commons/response.common');
class GroupController {
    async createGroup(req, res, next) {
        const {params} = req.input;
        const {name, members} = params;
        const groupName = stringSubstr(name, Constants.GROUP_NAME_MAX_LENGTH);
        let result = null;
        if (members.length < 1) {
            result = error(FAIL, "Group's member count should be greater than 1 at least");
        }
        if (members.length > SERVER_UNKNOW_ERROR) {
            result = error(FAIL, `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`);
        }
        try {
            await GroupService.createGroup(req.user, {name: groupName, members});
            result = success(null, "Create new group success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async addGroupMembers(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await GroupService.addGroupMembers(req.user, params.groupID, params.members);
            result = success(null, "Add group member success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next()
    };

    async joinGroup(req, res, next) {
        const {params} = req.input;

        let result = null;
        const {joinType, groupID} = params;
        try {
            await GroupService.joinGroup(req.user, groupID, joinType);
            result = success(null, "Join group success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next()
    };

    async kickGroupMember(req, res, next) {
        const {params} = req.input || {};
        let result = null;
        const {groupID, targetUserID} = params;
        try {
            await GroupService.kickGroupMember(req.user, groupID, targetUserID);
            result = success(null, "Kick member success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async quitGroup(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await GroupService.quitGroup(req.user, params.groupID);
            result = success(null, "Quit group success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async dismissGroup(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await GroupService.dismissGroup(req.user, params.groupID);
            result = success(null, "Dismiss group success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async renameGroup(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            if (_.isEmpty(params.name)) {
                result = fail(FAIL, `Parameters are missing, please input the new group name`);
            } else {
                await GroupService.renameGroup(req.user, params.groupID, params.name);
                result = success(null, "Group rename success");
            }
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async updateGroupNotice(req, res, next) {
        const {params} = req.input;

        if (params.notice.length > 100) {
            req.output = fail(FAIL, `Group's notice is out of max length limit (${Constants.GROUP_NOTICE_MAX_LENGTH})`);
            return next()
        }
        let result = null;
        try {
            await GroupService.updateGroupNotice(req.user, params.groupID, params.notice || "");
            result = success(null, "Update group notice success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async updateGroupMemberAlias(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await GroupService.updateGroupMemberAlias(req.user, params.groupID, params.alias);
            result = success(null, "Alias update success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async getGroupList(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            const groups = await GroupService.getGroupList(params.userID);
            result = success(groups, "Alias update success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };
}

module.exports = new GroupController();
