const TempGroupModel = require('../models/tempGroup.model');
const MemberModel = require('../models/member.model');
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');
const uuidv4 = require('uuid/v4');

class TempGroupRepository {
    /**
     * Get temp groupID
     * @param {string} groupID
     * @returns {Promise<{tempGroupID: (string|*|tempGroupID|{default, type})}>}
     */
    async getTempGroupID(groupID) {
        const newTempGroupID = uuidv4();
        let tempGroupID = "";
        let tempGroup = await updateTempGroupByGroupID(groupID, newTempGroupID);
        if (tempGroup) {
            tempGroupID = newTempGroupID;
        } else {
            const createResult = await createTempGroup(groupID);
            tempGroupID = createResult.tempGroupID;
        }
        return {
            tempGroupID,
        };
    };

    /**
     * Get group profile by temp group ID
     * @param {string} tempGroupID
     * @returns {Promise<{group: ({members, name, id}|{member, id}|{name, id}|{id}|{members, id, minute}|{members, id})}>}
     */
    async getGroupProfileByTempGroupID(tempGroupID) {
        const group = await queryGroupByTempGroupID(tempGroupID);
        if (!group) {
            throw new TError(FAIL, "This ID is expired, please reacquire");
        }
        return {group};
    };
}

const updateTempGroupByGroupID = (groupID, tempGroupID) => {
    return TempGroupModel.findOneAndUpdate({group: groupID}, {$set: {tempGroupID: tempGroupID}})
        .populate("group")
        .lean()
        .exec()
        .catch(err => {
            throw new TError(SERVER_UNKNOW_ERROR, `Server error, ${err.message}`);
        });
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
    const members = await MemberModel.find({groupID: _group.groupID}).lean()
        .catch(err => {
            throw new TError(SERVER_UNKNOW_ERROR, `Server error, ${err.message}`);
        });
    _group["members"] = convertMember(members);
    return _group;
};

const createTempGroup = groupID => {
    try {
        return new TempGroupModel({group: groupID, tempGroupID: uuidv4()}).save();
    } catch (err) {
        throw new TError(SERVER_UNKNOW_ERROR, `Serer error, ${err.message}`);
    }
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

module.exports = new TempGroupRepository();
