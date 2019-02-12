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
// const {handleRequestTest, handleResponse} = require('../commons/aspect.common.js');
const AspectHelper = require('../commons/aspect.common.js');
// user
router.post('/getUserProfile', AspectHelper.handleRequestWithTokenTest, getUserProfile, AspectHelper.handleResponse);
router.post('/updateUserProfile', AspectHelper.handleRequestWithTokenTest, updateUserProfile, AspectHelper.handleResponse);
router.post('/searchUser', AspectHelper.handleRequestWithTokenTest, searchUserByTelephoneOrNickname, AspectHelper.handleResponse);
// // temp user
// router.post('/getTempUserID', AESAscept.decryptParam, getTempUserID, AESAscept.encryptParam);
// router.post('/getUserProfileByTempUserID', AESAscept.decryptParam, getUserProfileByTempUserID, AESAscept.encryptParam);

// avatar upload
router.post('/uploadAvatar', uploadAvatar);
router.post('/uploadAvatarByBase64', uploadAvatarByBase64);

module.exports = router;