const GroupModel = require('../models/group.server.model');
const TempGroupModel = require('../models/tempGroup.server.model');
const MemberModel = require('../models/member.server.model');
const Constants = require('../utils/Constants');
const DateUtils = require('../utils/DateUtils');
const StringUtil = require('../utils/StringUtil');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

const uuidv4 = require('uuid/v4');
const _ = require('lodash');

exports.getTempGroupID = async groupID => {
  let result = { status: FAIL, data: {}, message: '' };
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
}

exports.getGroupProfileByTempGroupID = async tempGroupID => {
  let result = { status: FAIL, data: {}, message: '' };
  try {
    let tempGroup = await queryGroupByTempGroupID(tempGroupID);
    if (tempGroup) {
      result.data.group = tempGroup;
      result.status = SUCCESS;
    } else {
      result.message = "This ID is expired, please reacquire";
    }
  } catch (err) {
    result.message = err.message;
  }
  return result;
}

var updateTempGroupByGroupID = (groupID, tempGroupID) => {
  return TempGroupModel.findOneAndUpdate({ group: groupID }, { $set: { tempGroupID: tempGroupID } })
    .populate("group");
}

var queryGroupByTempGroupID = async tempGroupID => {
  let group = await TempGroupModel.findOne({ tempGroupID: tempGroupID })
    .populate("group");
  if (!group) return null;
  let _group = convertGroupProfile(group.group);
  let members = await MemberModel.find({ groupID: _group.groupID });
  _group.members = convertMember(members);
  return _group;
}

var createTempGroup = groupID => {
  let tempGroup = new TempGroupModel({ group: groupID, tempGroupID: uuidv4() });
  return tempGroup.save();
}

var convertGroupProfile = group => {
  let _group = JSON.parse(JSON.stringify(group));
  _group.groupID = group._id;

  delete _group._id;
  delete _group.updateTime;

  return _group;
}

var convertMember = members => {
  let _members = JSON.parse(JSON.stringify(members));
  for(let i = 0; i < _members.length; i++) {
    let m = _members[i];
    delete m._id;
    delete m.updateTime;
    delete m.createTime;
    delete m.role;
    delete m.status;
  }
  return _members;
}