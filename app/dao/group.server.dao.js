let GroupModel = require("../models/group.server.model");
const Constants = require("../utils/Constants");
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

exports.createGroup = async (currentUserID, groupInfo, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    try {
        let count = await isGroupCountOverflow(currentUserID);
        // TODO
    } catch (err) {
        result.message = err;
    }
};

var isGroupCountOverflow = currentUserID => {
    return new Promise((resolve, reject) => {
        GroupModel.count({ owner: currentUserID }, (err, count => {
            if (err) {
                reject(err)
            } else if (count >= Constants.MAX_GROUP_COUNT) {
                return false;
            }
        }))
    })
}