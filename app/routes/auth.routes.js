const express = require('express');
const router = express.Router();
const UserControl = require('../controllers/user.controller');
const {sendSMS, verifyCode} = require('../controllers/sms.controller');
const AsceptControl = require('../controllers/aspect.controller');

let RSAAscept = AsceptControl.RSA;

const {handleRequestTest, handleResponse} = require('../commons/aspect.common.js');

router.get('/getSecretKey', UserControl.getPublicKey);

router.post('/register', RSAAscept.decryptParam, UserControl.register, RSAAscept.encryptParam);
router.post('/login', RSAAscept.decryptParam, UserControl.login, RSAAscept.encryptParam);
router.post('/logout', RSAAscept.decryptParam, UserControl.logout, RSAAscept.encryptParam);
router.post('/tokenVerify', UserControl.tokenVerifyLogin);
// sms
router.post('/obtainSMSCode', handleRequestTest, sendSMS, handleResponse);
router.post('/verifySMSCode', RSAAscept.decryptParam, verifyCode, RSAAscept.encryptParam);

module.exports = router;