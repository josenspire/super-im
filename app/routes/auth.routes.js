const express = require('express');
const router = express.Router();
const {
    getPublicKey,
    register,
    login,
    logout,
    tokenVerifyLogin
} = require('../controllers/user.controller');
const {sendSMS, verifyCode} = require('../controllers/sms.controller');
const AspectControl = require('../controllers/aspect.controller');

let RSAAspect = AspectControl.RSA;

const {handleRequestTest, handleResponse} = require('../commons/aspect.common.js');

router.get('/getSecretKey', getPublicKey);

router.post('/register', handleRequestTest, register, handleResponse);
router.post('/login', RSAAspect.decryptParam, login, RSAAspect.encryptParam);
router.post('/logout', RSAAspect.decryptParam, logout, RSAAspect.encryptParam);
router.post('/tokenVerify', tokenVerifyLogin);
// sms
router.post('/obtainSMSCode', handleRequestTest, sendSMS, handleResponse);
router.post('/verifySMSCode', RSAAspect.decryptParam, verifyCode, RSAAspect.encryptParam);

module.exports = router;