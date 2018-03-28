const express = require('express');
const router = express.Router();
const UserControl = require('../controllers/user.server.controller');
const TempUserControl = require('../controllers/tempUser.server.controller');
const AsceptControl = require('../controllers/aspect.server.controller');
let AESAscept = AsceptControl.AES;

// user
router.post('/getUserProfile', AESAscept.decryptParam, UserControl.getUserProfile, AESAscept.encryptParam);
router.post('/updateUserProfile', AESAscept.decryptParam, UserControl.updateUserProfile, AESAscept.encryptParam);
router.post('/searchUser', AESAscept.decryptParam, UserControl.searchUserByTelephoneOrNickname, AESAscept.encryptParam);
// temp user
router.post('/getTempUserID', AESAscept.decryptParam, TempUserControl.getTempUserID, AESAscept.encryptParam);
router.post('/getUserProfileByTempUserID', AESAscept.decryptParam, TempUserControl.getUserProfileByTempUserID, AESAscept.encryptParam);

// avatar upload
router.post('/uploadAvatar', UserControl.uploadAvatar);
router.post('/uploadAvatarByBase64', UserControl.uploadAvatarByBase64);

module.exports = router;