const TempGroupModel = require('../models/tempGroup.model');
const MemberModel = require('../models/member.model');
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');
const uuidv4 = require('uuid/v4');

class TempGroupRepository {
    /**
     * Get temp groupID
     * @param {string} groupID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async getTempGroupID(groupID) {
        let result = {status: FAIL, data: {}, message: ''};
        let newTempGroupID = uuidv4();
        try {
            let tempGroup = await updateTempGroupByGroupID(groupID, newTempGroupID);
            if (tempGroup) {
                result.data.tempGroupID = newTempGroupID;
            } else {
                let createResult = await createTempGroup(groupID);
                result.data.tempGroupID = createResult.tempGroupID;
            }
            result.status = SUCCESS;
        } catch (err) {
            result.message = err.message;
        }
        return result;
    };

    /**
     * Get group profile by temp group ID
     * @param {string} tempGroupID
     * @returns {Promise<Object>}
     */
    async getGroupProfileByTempGroupID(tempGroupID) {
        const tempGroup = await queryGroupByTempGroupID(tempGroupID);
        if (!tempGroup) {
            throw new TError(FAIL, "This ID is expired, please reacquire");
        }
        return {group};
    };
}

module.exports = new TempGroupRepository();

const updateTempGroupByGroupID = (groupID, tempGroupID) => {
    return TempGroupModel.findOneAndUpdate({group: groupID}, {$set: {tempGroupID: tempGroupID}})
        .populate("group").exec();
};

const queryGroupByTempGroupID = async tempGroupID => {
    let group = await TempGroupModel
        .findOne({tempGroupID: tempGroupID})
        .populate("group")
        .lean()
        .exec()
        .catch(err => {
            throw new TError(SERVER_UNKNOW_ERROR, "Server error, get group information fail")
        });
    if (!group) return null;
    const _group = convertGroupProfile(group.group);
    const members = await MemberModel.find({groupID: _group.groupID});
    _group["members"] = convertMember(members);
    return _group;
};

const createTempGroup = groupID => {
    let tempGroup = new TempGroupModel({group: groupID, tempGroupID: uuidv4()});
    return tempGroup.save();
};

const convertGroupProfile = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    return _group;
};

const convertMember = members => {
    let _members = JSON.parse(JSON.stringify(members));
    for (let i = 0; i < _members.length; i++) {
        let m = _members[i];
        delete m._id;
        delete m.updateTime;
        delete m.createTime;
        delete m.role;
        delete m.status;
    }
    return _members;
};