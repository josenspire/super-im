const express = require('express');
const router = express.Router();
const GroupControl = require('../controllers/group.server.controller');
const TempGroupControl = require('../controllers/tempGroup.server.controller');
const AsceptControl = require('../controllers/aspect.server.controller');
let AESAscept = AsceptControl.AES;

// group
router.post('/create', AESAscept.decryptParam, GroupControl.createGroup, AESAscept.encryptParam);
router.post('/add', AESAscept.decryptParam, GroupControl.addGroupMembers, AESAscept.encryptParam);
router.post('/join', AESAscept.decryptParam, GroupControl.joinGroup, AESAscept.encryptParam);
router.post('/kick', AESAscept.decryptParam, GroupControl.kickGroupMember, AESAscept.encryptParam);
router.post('/quit', AESAscept.decryptParam, GroupControl.quitGroup, AESAscept.encryptParam);
router.post('/dismiss', AESAscept.decryptParam, GroupControl.dismissGroup, AESAscept.encryptParam);
router.post('/rename', AESAscept.decryptParam, GroupControl.renameGroup, AESAscept.encryptParam);
router.post('/updateNotice', AESAscept.decryptParam, GroupControl.updateGroupNotice, AESAscept.encryptParam);
router.post('/updateAlias', AESAscept.decryptParam, GroupControl.updateGroupMemberAlias, AESAscept.encryptParam);
router.post('/getGroups', AESAscept.decryptParam, GroupControl.getGroupList, AESAscept.encryptParam);
// temp group
router.post('/getTempGroupID', AESAscept.decryptParam, TempGroupControl.getTempGroupID, AESAscept.encryptParam);
router.post('/getGroupByTempGroupID', AESAscept.decryptParam, TempGroupControl.getGroupProfileByTempGroupID, AESAscept.encryptParam);

module.exports = router;
