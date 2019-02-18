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
router.post('/create', AspectHelper.handleRequestWithTokenVerify, createGroup, AspectHelper.handleResponse);
router.post('/add', AspectHelper.handleRequestWithTokenVerify, addGroupMembers, AspectHelper.handleResponse);
router.post('/join', AspectHelper.handleRequestWithTokenVerify, joinGroup, AspectHelper.handleResponse);
router.post('/kick', AspectHelper.handleRequestWithTokenVerify, kickGroupMember, AspectHelper.handleResponse);
router.post('/quit', AspectHelper.handleRequestWithTokenVerify, quitGroup, AspectHelper.handleResponse);
router.post('/dismiss', AspectHelper.handleRequestWithTokenVerify, dismissGroup, AspectHelper.handleResponse);
router.post('/rename', AspectHelper.handleRequestWithTokenVerify, renameGroup, AspectHelper.handleResponse);
router.post('/updateNotice', AspectHelper.handleRequestWithTokenVerify, updateGroupNotice, AspectHelper.handleResponse);
router.post('/updateAlias', AspectHelper.handleRequestWithTokenVerify, updateGroupMemberAlias, AspectHelper.handleResponse);
router.post('/getGroups', AspectHelper.handleRequestWithTokenVerify, getGroupList, AspectHelper.handleResponse);
// // temp group
router.post('/getTempGroupID', AspectHelper.handleRequestWithTokenVerify, getTempGroupID, AspectHelper.handleResponse);
router.post('/getGroupByTempGroupID', AspectHelper.handleRequestWithTokenVerify, getGroupProfileByTempGroupID, AspectHelper.handleResponse);

module.exports = router;
