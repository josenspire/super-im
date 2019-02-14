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
router.post('/join', AspectHelper.handleRequestWithTokenTest, joinGroup, AspectHelper.handleResponse);
router.post('/kick', AspectHelper.handleRequestWithTokenTest, kickGroupMember, AspectHelper.handleResponse);
router.post('/quit', AspectHelper.handleRequestWithTokenTest, quitGroup, AspectHelper.handleResponse);
router.post('/dismiss', AspectHelper.handleRequestWithTokenTest, dismissGroup, AspectHelper.handleResponse);
router.post('/rename', AspectHelper.handleRequestWithTokenTest, renameGroup, AspectHelper.handleResponse);
router.post('/updateNotice', AspectHelper.handleRequestWithTokenTest, updateGroupNotice, AspectHelper.handleResponse);
router.post('/updateAlias', AspectHelper.handleRequestWithTokenTest, updateGroupMemberAlias, AspectHelper.handleResponse);
router.post('/getGroups', AspectHelper.handleRequestWithTokenTest, getGroupList, AspectHelper.handleResponse);
// // temp group
router.post('/getTempGroupID', AspectHelper.handleRequestWithTokenTest, getTempGroupID, AspectHelper.handleResponse);
router.post('/getGroupByTempGroupID', AspectHelper.handleRequestWithTokenTest, getGroupProfileByTempGroupID, AspectHelper.handleResponse);

module.exports = router;
