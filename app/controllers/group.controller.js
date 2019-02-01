const GroupService = require("../services/group.service");
const StringUtil = require("../utils/StringUtil");
const Constants = require("../utils/Constants");
const {FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");

class GroupController {
    async createGroup(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const name = StringUtil.stringSubstr(input.name, Constants.GROUP_NAME_MAX_LENGTH);
        const members = input.members;

        if (members.length < 1) {
            return res.json({
                status: FAIL,
                data: {},
                message: "Group's member count should be greater than 1 at least"
            })
        };
        if (members.length > SERVER_UNKNOW_ERROR) {
            return res.json({
                status: FAIL,
                data: {},
                message: `Group's member count is out of max group member count limit (${Constants.DEFAULT_MAX_GROUP_MEMBER_COUNT})`
            })
        }
        const result = await GroupService.createGroup(currentUser, {name, members});
        return res.json(result)
    };

    async addGroupMembers(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const result = await GroupService.addGroupMembers(currentUser, input.groupID, input.members);
        res.json(result);
    };

    async joinGroup(req, res, next) {
        const input = req.data.input || {};
        const currentUser = req.data.user;

        const {joinType, groupID} = input;
        const result = await GroupService.joinGroup(currentUser, groupID, joinType);
        res.json(result);
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
