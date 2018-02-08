const GroupService = require("../services/group.server.service");
const StringUtil = require("../utils/StringUtil");
const { SUCCESS, FAIL } = require("../utils/CodeConstants");

exports.createGroup = (req, res, next) => {
    let input = req.data.input || {};
    let userID = input.userID;

    let name = StringUtil.stringSubstr(input.name, Constants.GROUP_NAME_MAX_LENGTH);
    let members = input.members;

    if (members.length < 2) {
        return res.json({
            status: FAIL,
            data: {},
            message: "Group's member count should be greater than 1 at least"
        })
    };
    let groupInfo = {
        name: name,
        members: members
    };
    GroupService.createGroup(currentUserID, groupInfo, result => {
        return res.json(result)
    });
}