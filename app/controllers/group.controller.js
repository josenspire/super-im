const GroupService = require("../services/group.service");
const {stringSubstr} = require("../utils/StringUtil");
const Constants = require("../utils/Constants");
const {FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const {success, error} = require('../commons/response.common');

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
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const result = await GroupService.kickGroupMember(currentUser, input.groupID, input.targetUserID);
        res.json(result);
    };

    async quitGroup(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const result = await GroupService.quitGroup(currentUser, input.groupID);
        res.json(result);
    };

    async dismissGroup(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const result = await GroupService.dismissGroup(currentUser, input.groupID);
        res.json(result);
    };

    async renameGroup(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const result = await GroupService.renameGroup(currentUser, input.groupID, input.name);
        res.json(result);
    };

    async updateGroupNotice(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        if (input.notice.length > 100) {
            return res.json({
                status: FAIL,
                data: {},
                message: `Group's notice is out of max length limit (${Constants.GROUP_NOTICE_MAX_LENGTH})`
            })
        }
        const result = await GroupService.updateGroupNotice(currentUser, input.groupID, input.notice);
        res.json(result);
    }

    async updateGroupMemberAlias(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const result = await GroupService.updateGroupMemberAlias(currentUser, input.groupID, input.alias);
        res.json(result);
    };

    async getGroupList(req, res, next) {
        const input = req.data.input || {};
        const result = await GroupService.getGroupList(input.userID);
        res.json(result);
    }
};

module.exports = new GroupController();
