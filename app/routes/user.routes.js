const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    searchUserByTelephoneOrNickname,
    uploadAvatar,
    uploadAvatarByBase64,
} = require('../controllers/user.controller');
const {
    getTempUserID,
    getUserProfileByTempUserID,
} = require('../controllers/tempUser.controller');
const AspectHelper = require('../commons/aspect.common.js');

// user
router.post('/getUserProfile', AspectHelper.handleRequestWithTokenVerify, getUserProfile, AspectHelper.handleResponse);
router.post('/updateUserProfile', AspectHelper.handleRequestWithTokenVerify, updateUserProfile, AspectHelper.handleResponse);
router.post('/searchUser', AspectHelper.handleRequestWithTokenVerify, searchUserByTelephoneOrNickname, AspectHelper.handleResponse);
// temp user
router.post('/getTempUserID', AspectHelper.handleRequestWithTokenVerify, getTempUserID, AspectHelper.handleResponse);
router.post('/getUserProfileByTempUserID', AspectHelper.handleRequestWithTokenVerify, getUserProfileByTempUserID, AspectHelper.handleResponse);

// avatar upload
router.post('/uploadAvatar', uploadAvatar);
router.post('/uploadAvatarByBase64', uploadAvatarByBase64);

module.exports = router;