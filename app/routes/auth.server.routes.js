const express = require('express');
const router = express.Router();
const UserControl = require('../controllers/user.server.controller');
const SMSControl = require('../controllers/sms.server.controller');
const AsceptControl = require('../controllers/aspect.server.controller');

let RSAAscept = AsceptControl.RSA;

router.get('/getSecretKey', UserControl.getPublicKey);

router.post('/register', RSAAscept.decryptParam, UserControl.register, RSAAscept.encryptParam);
router.post('/login', RSAAscept.decryptParam, UserControl.login, RSAAscept.encryptParam);
router.post('/logout', RSAAscept.decryptParam, UserControl.logout, RSAAscept.encryptParam);
router.post('/tokenVerify', UserControl.tokenVerifyLogin);
// sms
router.post('/obtainSMSCode', RSAAscept.decryptParam, SMSControl.sendSMS, RSAAscept.encryptParam);
router.post('/verifySMSCode', RSAAscept.decryptParam, SMSControl.verifyCode, RSAAscept.encryptParam);

module.exports = router;