const TempGroupModel = require('../models/tempGroup.model');
const MemberModel = require('../models/member.model');
const {SUCCESS, FAIL} = require("../utils/CodeConstants");

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
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async getGroupProfileByTempGroupID(tempGroupID) {
        let result = {status: FAIL, data: {}, message: ''};
        try {
            const tempGroup = await queryGroupByTempGroupID(tempGroupID);
            if (tempGroup) {
                result.data.group = tempGroup;
                result.status = SUCCESS;
            } else {
                result.message = "This ID is expired, please reacquire";
            }
        } catch (err) {
            console.log('[QUERY TEMP GROUP ERROR]: ', err.message);
            result.message = err.message;
        }
        return result;
    };

};

module.exports = new TempGroupRepository();

var updateTempGroupByGroupID = (groupID, tempGroupID) => {
    return TempGroupModel.findOneAndUpdate({group: groupID}, {$set: {tempGroupID: tempGroupID}})
        .populate("group").exec();
};

var queryGroupByTempGroupID = async tempGroupID => {
    let group = await TempGroupModel.findOne({tempGroupID: tempGroupID})
        .populate("group").exec();
    if (!group) return null;
    let _group = convertGroupProfile(group.group);
    let members = await MemberModel.find({groupID: _group.groupID});
    _group.members = convertMember(members);
    return _group;
};

var createTempGroup = groupID => {
    let tempGroup = new TempGroupModel({group: groupID, tempGroupID: uuidv4()});
    return tempGroup.save();
};

var convertGroupProfile = group => {
    let _group = JSON.parse(JSON.stringify(group));
    _group.groupID = group._id;

    delete _group._id;
    delete _group.updateTime;

    return _group;
};

var convertMember = members => {
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