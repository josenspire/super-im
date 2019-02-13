const express = require('express');
const router = express.Router();
const {
    createGroup,
    addGroupMembers,
    joinGroup,
    kickGroupMember,
    quitGroup,
    dismissGroup,
    renameGroup,
    updateGroupNotice,
    updateGroupMemberAlias,
    getGroupList,
} = require('../controllers/group.controller');
const {
    getTempGroupID,
    getGroupProfileByTempGroupID,
} = require('../controllers/tempGroup.controller');

const AspectHelper = require('../commons/aspect.common.js');

// group
router.post('/create', AspectHelper.handleRequestWithTokenTest, createGroup, AspectHelper.handleResponse);
router.post('/add', AspectHelper.handleRequestWithTokenTest, addGroupMembers, AspectHelper.handleResponse);
// router.post('/join', AESAscept.decryptParam, joinGroup, AESAscept.encryptParam);
// router.post('/kick', AESAscept.decryptParam, kickGroupMember, AESAscept.encryptParam);
// router.post('/quit', AESAscept.decryptParam, quitGroup, AESAscept.encryptParam);
// router.post('/dismiss', AESAscept.decryptParam, dismissGroup, AESAscept.encryptParam);
// router.post('/rename', AESAscept.decryptParam, renameGroup, AESAscept.encryptParam);
// router.post('/updateNotice', AESAscept.decryptParam, updateGroupNotice, AESAscept.encryptParam);
// router.post('/updateAlias', AESAscept.decryptParam, updateGroupMemberAlias, AESAscept.encryptParam);
// router.post('/getGroups', AESAscept.decryptParam, getGroupList, AESAscept.encryptParam);
// // temp group
// router.post('/getTempGroupID', AESAscept.decryptParam, getTempGroupID, AESAscept.encryptParam);
// router.post('/getGroupByTempGroupID', AESAscept.decryptParam, getGroupProfileByTempGroupID, AESAscept.encryptParam);

module.exports = router;
